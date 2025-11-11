import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { User } from '../users/entities/user.entity';
import { FindAvailableDeliveriesDto } from './dto/find-available-deliveries.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus } from '../common/enums/order-status.enum';
import { Role } from '../common/enums/role.enum';
import { DeliveryType } from '../payments/entities/restaurant-delivery-config.entity';

@Injectable()
export class DeliveriesService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAvailableDeliveries(
    findAvailableDeliveriesDto: FindAvailableDeliveriesDto,
    driverId: string,
  ): Promise<{ orders: Order[]; total: number }> {
    const {
      latitude,
      longitude,
      radius,
      page = 1,
      limit = 10,
    } = findAvailableDeliveriesDto;
    const skip = (page - 1) * limit;

    // Verificar que el usuario sea un repartidor
    const driver = await this.userRepository.findOne({
      where: { id: driverId },
      relations: ['role'],
    });

    if (!driver || driver.role.name !== Role.DRIVER) {
      throw new ForbiddenException(
        'Only drivers can access available deliveries',
      );
    }

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.client', 'client')
      .leftJoinAndSelect('order.restaurant', 'restaurant')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.menuItem', 'menuItem')
      // 🔗 JOIN con restaurant_delivery_config para filtrar por tipo
      .leftJoin(
        'restaurant_delivery_config',
        'config',
        'config.restaurant_id = restaurant.id',
      )
      .where('order.status IN (:...statuses)', {
        statuses: [
          OrderStatus.CONFIRMED,
          OrderStatus.PREPARING,
          OrderStatus.READY_FOR_PICKUP,
        ],
      })
      .andWhere('order.driver IS NULL') // Solo pedidos sin repartidor asignado
      // 🎯 FILTRO CRÍTICO: Solo mostrar pedidos con delivery tipo 'platform'
      .andWhere("config.delivery_type = 'platform'");

    // Si se proporcionan coordenadas, filtrar por proximidad
    if (latitude && longitude && radius) {
      queryBuilder.andWhere(
        `ST_DWithin(
          restaurant.location::geography,
          ST_MakePoint(:longitude, :latitude)::geography,
          :radiusMeters
        )`,
        {
          longitude,
          latitude,
          radiusMeters: radius * 1000, // Convertir km a metros
        },
      );
    }

    queryBuilder
      .orderBy('order.createdAt', 'ASC') // Primeros en llegar, primeros en ser servidos
      .skip(skip)
      .take(limit);

    const [orders, total] = await queryBuilder.getManyAndCount();

    return { orders, total };
  }

  /**
   * Obtiene pedidos PENDING para que drivers puedan planificar
   * (solo lectura, no pueden aceptarlos hasta que restaurant confirme)
   */
  async findPendingDeliveries(
    findAvailableDeliveriesDto: FindAvailableDeliveriesDto,
    driverId: string,
  ): Promise<{ orders: Order[]; total: number }> {
    const {
      latitude,
      longitude,
      radius,
      page = 1,
      limit = 10,
    } = findAvailableDeliveriesDto;
    const skip = (page - 1) * limit;

    // Verificar que el usuario sea un repartidor
    const driver = await this.userRepository.findOne({
      where: { id: driverId },
      relations: ['role'],
    });

    if (!driver || driver.role.name !== Role.DRIVER) {
      throw new ForbiddenException(
        'Only drivers can access pending deliveries',
      );
    }

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.client', 'client')
      .leftJoinAndSelect('order.restaurant', 'restaurant')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.menuItem', 'menuItem')
      // 🔗 JOIN con restaurant_delivery_config para filtrar por tipo
      .leftJoin(
        'restaurant_delivery_config',
        'config',
        'config.restaurant_id = restaurant.id',
      )
      .where('order.status = :status', { status: OrderStatus.PENDING })
      .andWhere('order.driver IS NULL') // Solo pedidos sin repartidor
      // 🎯 FILTRO: Solo mostrar pedidos con delivery tipo 'platform'
      .andWhere("config.delivery_type = 'platform'");

    // Si se proporcionan coordenadas, filtrar por proximidad
    if (latitude && longitude && radius) {
      queryBuilder.andWhere(
        `ST_DWithin(
          restaurant.location::geography,
          ST_MakePoint(:longitude, :latitude)::geography,
          :radiusMeters
        )`,
        {
          longitude,
          latitude,
          radiusMeters: radius * 1000,
        },
      );
    }

    queryBuilder
      .orderBy('order.createdAt', 'DESC') // Más recientes primero
      .skip(skip)
      .take(limit);

    const [orders, total] = await queryBuilder.getManyAndCount();

    return { orders, total };
  }

  async acceptOrder(orderId: string, driverId: string): Promise<Order> {
    // Verificar que el usuario sea un repartidor
    const driver = await this.userRepository.findOne({
      where: { id: driverId },
      relations: ['role'],
    });

    if (!driver || driver.role.name !== Role.DRIVER) {
      throw new ForbiddenException('Only drivers can accept orders');
    }

    // Buscar el pedido
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['client', 'restaurant', 'driver', 'items', 'items.menuItem'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Verificar que el pedido esté en estado que permite ser aceptado por driver
    const acceptableStatuses = [
      OrderStatus.CONFIRMED,
      OrderStatus.PREPARING,
      OrderStatus.READY_FOR_PICKUP,
    ];
    if (!acceptableStatuses.includes(order.status)) {
      throw new BadRequestException(
        'Order must be CONFIRMED, PREPARING, or READY_FOR_PICKUP to be accepted',
      );
    }

    // Verificar que no tenga repartidor asignado
    if (order.driver) {
      throw new BadRequestException('Order already has a driver assigned');
    }

    // Asignar el repartidor y cambiar el estado a PREPARING si está CONFIRMED
    order.driver = driver;
    if (order.status === OrderStatus.CONFIRMED) {
      order.status = OrderStatus.PREPARING;
    }
    // Si ya está en PREPARING o READY_FOR_PICKUP, mantener ese estado

    return await this.orderRepository.save(order);
  }

  async updateOrderStatus(
    orderId: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
    driverId: string,
  ): Promise<Order> {
    const { status } = updateOrderStatusDto;

    // Verificar que el usuario sea un repartidor
    const driver = await this.userRepository.findOne({
      where: { id: driverId },
      relations: ['role'],
    });

    if (!driver || driver.role.name !== Role.DRIVER) {
      throw new ForbiddenException('Only drivers can update order status');
    }

    // Buscar el pedido
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['client', 'restaurant', 'driver', 'items', 'items.menuItem'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Verificar que el repartidor sea el asignado al pedido
    if (!order.driver || order.driver.id !== driverId) {
      throw new ForbiddenException(
        'You can only update status of orders assigned to you',
      );
    }

    // Validar transiciones de estado permitidas para repartidores
    const allowedTransitions = {
      [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
    };

    const currentStatus = order.status;
    const allowedNextStatuses = allowedTransitions[currentStatus] || [];

    if (!allowedNextStatuses.includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${status}`,
      );
    }

    // Actualizar el estado
    order.status = status;

    return await this.orderRepository.save(order);
  }

  async getMyActiveDeliveries(driverId: string): Promise<Order[]> {
    // Verificar que el usuario sea un repartidor
    const driver = await this.userRepository.findOne({
      where: { id: driverId },
      relations: ['role'],
    });

    if (!driver || driver.role.name !== Role.DRIVER) {
      throw new ForbiddenException('Only drivers can access their deliveries');
    }

    // Incluir todos los pedidos asignados al driver que aún no están entregados
    return await this.orderRepository.find({
      where: {
        driver: { id: driverId },
        status: In([
          OrderStatus.PREPARING,
          OrderStatus.READY_FOR_PICKUP,
          OrderStatus.OUT_FOR_DELIVERY,
        ]),
      },
      relations: ['client', 'restaurant', 'items', 'items.menuItem'],
      order: { createdAt: 'ASC' }, // Más antiguos primero (orden de prioridad)
    });
  }

  async getMyDeliveryHistory(
    driverId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ orders: Order[]; total: number }> {
    // Verificar que el usuario sea un repartidor
    const driver = await this.userRepository.findOne({
      where: { id: driverId },
      relations: ['role'],
    });

    if (!driver || driver.role.name !== Role.DRIVER) {
      throw new ForbiddenException(
        'Only drivers can access their delivery history',
      );
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await this.orderRepository.findAndCount({
      where: {
        driver: { id: driverId },
        status: OrderStatus.DELIVERED,
      },
      relations: ['client', 'restaurant', 'items', 'items.menuItem'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { orders, total };
  }
}
