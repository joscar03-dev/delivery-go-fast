import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { MenuItem } from '../restaurants/entities/menu-item.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { FindOrdersDto } from './dto/find-orders.dto';
import { OrderStatus } from '../common/enums/order-status.enum';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(MenuItem)
    private readonly menuItemRepository: Repository<MenuItem>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createOrderDto: CreateOrderDto,
    clientId: string,
  ): Promise<Order> {
    const { restaurantId, items, notes, deliveryAddress } = createOrderDto;

    // Verificar que el restaurante existe
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException(
        `Restaurant with ID ${restaurantId} not found`,
      );
    }

    // Verificar que todos los items del menú existen y pertenecen al restaurante
    const menuItemIds = items.map((item) => item.menuItemId);
    const menuItems = await this.menuItemRepository.find({
      where: {
        id: In(menuItemIds),
        restaurant: { id: restaurantId },
      },
    });

    if (menuItems.length !== items.length) {
      throw new BadRequestException(
        'Some menu items are invalid or do not belong to this restaurant',
      );
    }

    // Crear el pedido en una transacción
    return await this.dataSource.transaction(async (manager) => {
      // Crear la orden
      const order = manager.create(Order, {
        client: { id: clientId },
        restaurant: { id: restaurantId },
        status: OrderStatus.PENDING,
        notes,
        deliveryAddress,
        total: 0, // Lo calcularemos después
      });

      const savedOrder = await manager.save(Order, order);

      // Crear los items del pedido y calcular el total
      let total = 0;
      const orderItems: OrderItem[] = [];

      for (const itemDto of items) {
        const menuItem = menuItems.find((mi) => mi.id === itemDto.menuItemId);
        const subtotal = Number(menuItem.price) * itemDto.quantity;
        total += subtotal;

        const orderItem = manager.create(OrderItem, {
          order: savedOrder,
          menuItem: { id: menuItem.id },
          quantity: itemDto.quantity,
          unit_price: menuItem.price,
        });

        orderItems.push(orderItem);
      }

      await manager.save(OrderItem, orderItems);

      // Actualizar el total del pedido
      savedOrder.total = total;
      await manager.save(Order, savedOrder);

      // Retornar el pedido completo con sus relaciones
      return await manager.findOne(Order, {
        where: { id: savedOrder.id },
        relations: [
          'client',
          'restaurant',
          'driver',
          'items',
          'items.menuItem',
        ],
      });
    });
  }

  async findAll(
    findOrdersDto: FindOrdersDto,
    userId: string,
    userRole: Role,
  ): Promise<{ orders: Order[]; total: number }> {
    const { status, restaurantId, page = 1, limit = 10 } = findOrdersDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.client', 'client')
      .leftJoinAndSelect('order.restaurant', 'restaurant')
      .leftJoinAndSelect('order.driver', 'driver')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.menuItem', 'menuItem');

    // Filtros según el rol
    if (userRole === Role.CLIENT) {
      queryBuilder.where('order.client.id = :userId', { userId });
    } else if (userRole === Role.DRIVER) {
      queryBuilder.where('order.driver.id = :userId', { userId });
    } else if (userRole === Role.RESTAURANT_OWNER) {
      queryBuilder.where('restaurant.owner.id = :userId', { userId });
    }
    // SUPER_ADMIN puede ver todos los pedidos

    // Filtros adicionales
    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    if (restaurantId) {
      queryBuilder.andWhere('order.restaurant.id = :restaurantId', {
        restaurantId,
      });
    }

    // Paginación
    queryBuilder.orderBy('order.createdAt', 'DESC').skip(skip).take(limit);

    const [orders, total] = await queryBuilder.getManyAndCount();

    return { orders, total };
  }

  async findOne(id: string, userId: string, userRole: Role): Promise<Order> {
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.client', 'client')
      .leftJoinAndSelect('order.restaurant', 'restaurant')
      .leftJoinAndSelect('restaurant.owner', 'restaurantOwner')
      .leftJoinAndSelect('order.driver', 'driver')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.menuItem', 'menuItem')
      .where('order.id = :id', { id });

    const order = await queryBuilder.getOne();

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Verificar permisos
    if (userRole === Role.CLIENT && order.client.id !== userId) {
      throw new ForbiddenException('You can only access your own orders');
    }

    if (userRole === Role.DRIVER && order.driver?.id !== userId) {
      throw new ForbiddenException(
        'You can only access orders assigned to you',
      );
    }

    if (
      userRole === Role.RESTAURANT_OWNER &&
      order.restaurant.owner.id !== userId
    ) {
      throw new ForbiddenException(
        'You can only access orders from your restaurants',
      );
    }

    return order;
  }

  async update(
    id: string,
    updateOrderDto: UpdateOrderDto,
    userId: string,
    userRole: Role,
  ): Promise<Order> {
    const order = await this.findOne(id, userId, userRole);

    // Solo el repartidor puede actualizar el estado de entrega
    if (updateOrderDto.status && userRole === Role.DRIVER) {
      const allowedDriverStatuses = [
        OrderStatus.OUT_FOR_DELIVERY,
        OrderStatus.DELIVERED,
      ];
      if (!allowedDriverStatuses.includes(updateOrderDto.status)) {
        throw new BadRequestException('Invalid status update for driver');
      }
    }

    // Solo el restaurante puede actualizar ciertos estados
    if (updateOrderDto.status && userRole === Role.RESTAURANT_OWNER) {
      const allowedRestaurantStatuses = [
        OrderStatus.CONFIRMED,
        OrderStatus.PREPARING,
        OrderStatus.CANCELLED,
      ];
      if (!allowedRestaurantStatuses.includes(updateOrderDto.status)) {
        throw new BadRequestException('Invalid status update for restaurant');
      }
    }

    // Solo el cliente puede cancelar si el pedido está en PENDING
    if (
      updateOrderDto.status === OrderStatus.CANCELLED &&
      userRole === Role.CLIENT &&
      order.status !== OrderStatus.PENDING
    ) {
      throw new BadRequestException(
        'Order can only be cancelled while pending',
      );
    }

    Object.assign(order, updateOrderDto);
    return await this.orderRepository.save(order);
  }

  async assignDriver(orderId: string, driverId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['client', 'restaurant', 'driver'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (order.status !== OrderStatus.PREPARING) {
      throw new BadRequestException(
        'Order must be in PREPARING status to assign driver',
      );
    }

    order.driver = { id: driverId } as any;
    order.status = OrderStatus.OUT_FOR_DELIVERY;

    return await this.orderRepository.save(order);
  }
}
