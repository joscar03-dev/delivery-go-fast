import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { MenuItem } from '../restaurants/entities/menu-item.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { MenuOption } from '../restaurants/entities/menu-option.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { FindOrdersDto } from './dto/find-orders.dto';
import { OrderStatus } from '../common/enums/order-status.enum';
import { Role } from '../common/enums/role.enum';
import { DeliveryGateway } from '../geolocation/delivery.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentsService } from '../payments/payments.service';
import { CheckoutDto } from '../payments/dto/checkout.dto';
import { Address } from '../users/entities/address.entity';
import { OrderPayment } from '../payments/entities/order-payment.entity';
import { User } from '../users/entities/user.entity';
import { OrderCreatedEvent } from './events/order-created.event';
import { OrderStatusChangedEvent } from './events/order-status-changed.event';

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
    @InjectRepository(MenuOption)
    private readonly menuOptionRepository: Repository<MenuOption>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => DeliveryGateway))
    private readonly deliveryGateway: DeliveryGateway,
    private readonly notificationsService: NotificationsService,
    private readonly paymentsService: PaymentsService,
    private readonly eventEmitter: EventEmitter2,
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
        const baseUnit = Number(menuItem.price);

        // Calcular extraPrice por opciones seleccionadas (por unidad)
        let extrasUnit = 0;
        try {
          // Estructura esperada: { groups: [{ options: [{ id }] }] } o bien array de IDs
          const optionIds: string[] = [];
          const opts: any = itemDto.options;
          if (Array.isArray(opts)) {
            for (const id of opts)
              if (typeof id === 'string') optionIds.push(id);
          } else if (
            opts &&
            typeof opts === 'object' &&
            Array.isArray(opts.groups)
          ) {
            for (const g of opts.groups) {
              if (g && Array.isArray(g.options)) {
                for (const o of g.options) if (o?.id) optionIds.push(o.id);
              }
            }
          }

          if (optionIds.length) {
            const dbOptions = await manager.find(MenuOption, {
              where: { id: In(optionIds) },
            });
            for (const o of dbOptions) {
              extrasUnit += Number(o.extraPrice) || 0;
            }
          }
        } catch (e) {
          // Si algo falla, los extras quedan en 0 para no bloquear la orden
          extrasUnit = extrasUnit || 0;
        }

        const unitTotal = baseUnit + extrasUnit;
        const lineTotal = unitTotal * itemDto.quantity;
        total += lineTotal;

        const orderItem = manager.create(OrderItem, {
          order: savedOrder,
          menuItem: { id: menuItem.id },
          quantity: itemDto.quantity,
          unit_price: menuItem.price, // guardamos precio base; extras se reflejan en el total de la orden
          comment: itemDto.comment,
          options: itemDto.options,
        });

        orderItems.push(orderItem);
      }

      await manager.save(OrderItem, orderItems);

      // Actualizar el total del pedido
      savedOrder.total = total;
      await manager.save(Order, savedOrder);

      // Retornar el pedido completo con sus relaciones
      const completedOrder = await manager.findOne(Order, {
        where: { id: savedOrder.id },
        relations: [
          'client',
          'restaurant',
          'driver',
          'items',
          'items.menuItem',
        ],
      });

      // Emitir evento de nuevo pedido creado vía Socket.IO
      if (completedOrder) {
        this.emitNewOrderEvent(completedOrder);
      }

      return completedOrder;
    });
  }

  /**
   * Método checkout: Crea orden con sistema de pago completo
   * Incluye cálculo de delivery fee y registro de pago
   */
  async checkout(checkoutDto: CheckoutDto, clientId: string): Promise<Order> {
    const {
      restaurantId,
      items,
      deliveryAddressId,
      paymentMethodCode,
      cashAmount,
      transactionReference,
      paymentProofUrl,
      notes,
    } = checkoutDto;

    // 1. Verificar que el restaurante existe
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException(
        `Restaurant with ID ${restaurantId} not found`,
      );
    }

    // 2. Verificar que la dirección existe y pertenece al usuario
    const address = await this.addressRepository.findOne({
      where: { id: deliveryAddressId, user: { id: clientId } },
    });

    if (!address) {
      throw new NotFoundException(
        `Address with ID ${deliveryAddressId} not found or does not belong to the user`,
      );
    }

    // 3. Verificar que todos los items del menú existen
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

    // 4. Calcular subtotal (productos sin delivery)
    let subtotal = 0;
    for (const itemDto of items) {
      const menuItem = menuItems.find((mi) => mi.id === itemDto.menuItemId);
      const baseUnit = Number(menuItem.price);

      // Calcular extras por opciones
      let extrasUnit = 0;
      try {
        if (itemDto.options && typeof itemDto.options === 'object') {
          if (Array.isArray((itemDto.options as any).groups)) {
            const groups = (itemDto.options as any).groups;
            for (const g of groups) {
              if (Array.isArray(g.options)) {
                for (const opt of g.options) {
                  if (opt.id) {
                    const menuOpt = await this.menuOptionRepository.findOne({
                      where: { id: opt.id },
                    });
                    if (menuOpt && menuOpt.extraPrice) {
                      extrasUnit += Number(menuOpt.extraPrice);
                    }
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        // Si hay error calculando extras, continuar sin ellos
      }

      const unitTotal = baseUnit + extrasUnit;
      const lineTotal = unitTotal * itemDto.quantity;
      subtotal += lineTotal;
    }

    // 5. Calcular delivery fee
    const deliveryFeeRaw = await this.paymentsService.calculateDeliveryFee(
      restaurantId,
      subtotal,
    );

    // Asegurar que sea número
    const deliveryFee = Number(deliveryFeeRaw);

    // 6. Total = subtotal + delivery (ambos como números)
    const total = Number(subtotal) + Number(deliveryFee);

    // 7. Validar método de pago
    let changeAmount: number | undefined;
    if (paymentMethodCode === 'cash') {
      if (!cashAmount) {
        throw new BadRequestException(
          'Cash amount is required for cash payments',
        );
      }
      changeAmount = this.paymentsService.validateCashPayment(
        cashAmount,
        total,
      );
    }

    // 8. Crear orden y pago en transacción
    return await this.dataSource.transaction(async (manager) => {
      // Crear la orden
      const order = manager.create(Order, {
        client: { id: clientId },
        restaurant: { id: restaurantId },
        status: OrderStatus.PENDING,
        notes,
        deliveryAddress:
          `${address.street}, ${address.city} ${address.postalCode || ''}`.trim(),
        deliveryAddressId: address.id,
        // Extraer coordenadas del Point de PostGIS si existe
        deliveryLatitude: address.location
          ? (address.location as any).coordinates[1]
          : null,
        deliveryLongitude: address.location
          ? (address.location as any).coordinates[0]
          : null,
        subtotal: Number(subtotal),
        deliveryFee: Number(deliveryFee),
        total: Number(total),
      } as any);

      const savedOrder = await manager.save(Order, order);

      // Crear los items del pedido
      const orderItems: OrderItem[] = [];

      for (const itemDto of items) {
        const menuItem = menuItems.find((mi) => mi.id === itemDto.menuItemId);
        const baseUnit = Number(menuItem.price);

        // Calcular extras
        let extrasUnit = 0;
        try {
          if (itemDto.options && typeof itemDto.options === 'object') {
            if (Array.isArray((itemDto.options as any).groups)) {
              const groups = (itemDto.options as any).groups;
              for (const g of groups) {
                if (Array.isArray(g.options)) {
                  for (const opt of g.options) {
                    if (opt.id) {
                      const menuOpt = await this.menuOptionRepository.findOne({
                        where: { id: opt.id },
                      });
                      if (menuOpt && menuOpt.extraPrice) {
                        extrasUnit += Number(menuOpt.extraPrice);
                      }
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          // Si hay error calculando extras, continuar sin ellos
        }

        const unitTotal = baseUnit + extrasUnit;
        const lineTotal = unitTotal * itemDto.quantity;

        const orderItem = manager.create(OrderItem, {
          order: savedOrder,
          menuItem: { id: menuItem.id },
          quantity: itemDto.quantity,
          unit_price: baseUnit, // Cambiado de 'price' a 'unit_price'
          comment: itemDto.comment,
          options: itemDto.options,
        });

        orderItems.push(orderItem);
      }

      await manager.save(OrderItem, orderItems);

      // Crear registro de pago dentro de la transacción
      const payment = manager.create(OrderPayment, {
        orderId: savedOrder.id,
        paymentMethodCode,
        amount: Number(total),
        deliveryFee: Number(deliveryFee),
        subtotal: Number(subtotal),
        cashAmount: cashAmount ? Number(cashAmount) : undefined,
        changeAmount: changeAmount ? Number(changeAmount) : undefined,
        transactionReference,
        paymentProofUrl,
        notes,
        paymentStatus: paymentMethodCode === 'cash' ? 'verified' : 'pending',
        verifiedAt: paymentMethodCode === 'cash' ? new Date() : undefined,
      });

      await manager.save(OrderPayment, payment);

      // Retornar el pedido completo
      const completedOrder = await manager.findOne(Order, {
        where: { id: savedOrder.id },
        relations: [
          'client',
          'restaurant',
          'restaurant.owner', // ⬅️ AGREGADO: Necesario para el evento order.created
          'driver',
          'items',
          'items.menuItem',
        ],
      });

      // Emitir evento de nuevo pedido
      if (completedOrder) {
        this.emitNewOrderEvent(completedOrder);

        // TODO: Enviar notificación push al restaurante
        // await this.notificationsService.sendNewOrderNotification(...);
      }

      return completedOrder;
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
      .leftJoinAndSelect('restaurant.owner', 'restaurantOwner')
      .leftJoinAndSelect('order.driver', 'driver')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.menuItem', 'menuItem');

    // Filtros según el rol
    if (userRole === Role.CLIENT) {
      queryBuilder.where('order.client.id = :userId', { userId });
    } else if (userRole === Role.DRIVER) {
      queryBuilder.where('order.driver.id = :userId', { userId });
    } else if (userRole === Role.RESTAURANT_OWNER) {
      queryBuilder.where('restaurantOwner.id = :userId', { userId });
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
    const previousStatus = order.status;

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
        OrderStatus.READY_FOR_PICKUP,
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
    const updatedOrder = await this.orderRepository.save(order);

    // Emitir evento si cambió el estado
    if (updateOrderDto.status && updateOrderDto.status !== previousStatus) {
      this.emitOrderStatusUpdate(
        updatedOrder.id,
        updatedOrder.status,
        previousStatus,
      );
    }

    return updatedOrder;
  }

  /**
   * Confirma un pedido y establece el tiempo estimado de preparación
   */
  async confirmOrder(
    id: string,
    estimatedPrepTime: number,
    userId: string,
    userRole: Role,
  ): Promise<Order> {
    const order = await this.findOne(id, userId, userRole);

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        'Order must be in PENDING status to confirm',
      );
    }

    // Si no se proporciona tiempo, usar el tiempo promedio del restaurante
    if (!estimatedPrepTime) {
      const restaurant = await this.restaurantRepository.findOne({
        where: { id: order.restaurant.id },
      });
      estimatedPrepTime = restaurant?.averagePrepTime || 15;
    }

    const now = new Date();
    const estimatedReadyTime = new Date(
      now.getTime() + estimatedPrepTime * 60000,
    );

    const previousStatus = order.status;
    order.status = OrderStatus.CONFIRMED;
    order.confirmedAt = now;
    order.estimatedPrepTime = estimatedPrepTime;
    order.estimatedReadyTime = estimatedReadyTime;

    const updatedOrder = await this.orderRepository.save(order);

    // Emitir evento de cambio de estado
    this.emitOrderStatusUpdate(
      updatedOrder.id,
      updatedOrder.status,
      previousStatus,
    );

    return updatedOrder;
  }

  /**
   * Ajusta el tiempo de preparación agregando minutos adicionales
   */
  async adjustPrepTime(
    id: string,
    additionalMinutes: number,
    userId: string,
    userRole: Role,
  ): Promise<Order> {
    const order = await this.findOne(id, userId, userRole);

    if (
      order.status !== OrderStatus.CONFIRMED &&
      order.status !== OrderStatus.PREPARING
    ) {
      throw new BadRequestException(
        'Can only adjust prep time for confirmed or preparing orders',
      );
    }

    if (!order.estimatedReadyTime) {
      throw new BadRequestException('Order does not have estimated ready time');
    }

    // Agregar tiempo adicional
    order.estimatedPrepTime =
      (order.estimatedPrepTime || 0) + additionalMinutes;
    order.estimatedReadyTime = new Date(
      order.estimatedReadyTime.getTime() + additionalMinutes * 60000,
    );

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

    const previousStatus = order.status;
    order.driver = { id: driverId } as any;
    order.status = OrderStatus.OUT_FOR_DELIVERY;
    const updatedOrder = await this.orderRepository.save(order);

    // Emitir evento de cambio de estado
    this.emitOrderStatusUpdate(
      updatedOrder.id,
      updatedOrder.status,
      previousStatus,
    );

    return updatedOrder;
  }

  /**
   * Asignar driver a pedido para delivery propio del restaurante
   * Permite a RESTAURANT_OWNER asignar drivers a sus propios pedidos
   */
  async assignRestaurantDriver(
    orderId: string,
    driverId: string,
    userId: string,
    userRole: Role,
  ): Promise<Order> {
    // Buscar el pedido con todas las relaciones necesarias
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['client', 'restaurant', 'restaurant.owner', 'driver'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Verificar que el pedido pertenezca al restaurante del owner (si no es SUPER_ADMIN)
    if (userRole === Role.RESTAURANT_OWNER) {
      if (!order.restaurant.owner || order.restaurant.owner.id !== userId) {
        throw new ForbiddenException(
          'You can only assign drivers to your own restaurant orders',
        );
      }
    }

    // Verificar que el pedido esté en estado válido para asignación
    const validStatuses = [
      OrderStatus.CONFIRMED,
      OrderStatus.PREPARING,
      OrderStatus.READY_FOR_PICKUP,
    ];

    if (!validStatuses.includes(order.status)) {
      throw new BadRequestException(
        'Order must be CONFIRMED, PREPARING, or READY_FOR_PICKUP to assign driver',
      );
    }

    // Verificar que no tenga ya un driver asignado
    if (order.driver) {
      throw new BadRequestException(
        'Order already has a driver assigned. Cannot reassign driver.',
      );
    }

    // Verificar que el driver sea válido y tenga rol de DRIVER
    const driver = await this.dataSource.getRepository(User).findOne({
      where: { id: driverId },
      relations: ['role'],
    });

    if (!driver || driver.role.name !== Role.DRIVER) {
      throw new BadRequestException(
        'Invalid driver ID or user is not a driver',
      );
    }

    const previousStatus = order.status;

    // Asignar el driver
    order.driver = driver;

    // Si el pedido estaba CONFIRMED, cambiarlo a PREPARING
    if (order.status === OrderStatus.CONFIRMED) {
      order.status = OrderStatus.PREPARING;
    }
    // Si ya está en PREPARING o READY_FOR_PICKUP, mantener ese estado

    const updatedOrder = await this.orderRepository.save(order);

    // Emitir evento de actualización
    this.emitOrderStatusUpdate(
      updatedOrder.id,
      updatedOrder.status,
      previousStatus,
    );

    // Enviar notificación al driver
    try {
      await this.notificationsService.sendToUser(driverId, {
        title: '🚗 Nuevo Pedido Asignado',
        body: `Se te ha asignado el pedido #${orderId.substring(0, 8)}. ¡Prepárate para recogerlo!`,
        data: {
          type: 'driver_assigned',
          orderId: orderId,
        },
      });
      console.log(`✅ Notificación enviada al driver ${driverId}`);
    } catch (error) {
      console.error('Error enviando notificación al driver:', error);
      // No lanzar error, solo loggear (la asignación ya se hizo)
    }

    console.log(
      `✅ Driver ${driverId} asignado al pedido ${orderId} por ${userRole} ${userId}`,
    );

    return updatedOrder;
  }

  /**
   * Emite un evento Socket.IO cuando cambia el estado de un pedido
   * Y envía una Push Notification (Sistema Híbrido)
   */
  private async emitOrderStatusUpdate(
    orderId: string,
    newStatus: OrderStatus,
    previousStatus?: OrderStatus,
  ): Promise<void> {
    try {
      // 1. Emitir evento Socket.IO (para usuarios con app abierta)
      this.deliveryGateway.server.emit('order-status-updated', {
        orderId,
        status: newStatus,
        previousStatus,
      });
      console.log(
        `✅ [Socket.IO] Estado actualizado para pedido ${orderId}: ${previousStatus} → ${newStatus}`,
      );

      // 2. Emitir evento de cambio de estado (notificación automática vía event listener)
      const order = await this.orderRepository.findOne({
        where: { id: orderId },
        relations: ['client', 'restaurant', 'restaurant.owner', 'driver'],
      });

      if (order && order.client && order.restaurant) {
        this.eventEmitter.emit(
          'order.status.changed',
          new OrderStatusChangedEvent(
            order.id,
            order.id.substring(0, 8), // orderNumber
            order.client.id,
            order.restaurant.id,
            order.restaurant.owner?.id || '',
            order.restaurant.name,
            previousStatus,
            newStatus,
            order.driver?.id,
            Number(order.total),
            order.client.name,
          ),
        );
        console.log(
          `✅ [Event] Evento 'order.status.changed' emitido para pedido ${orderId}`,
        );
      }
    } catch (error) {
      console.error('Error en emitOrderStatusUpdate:', error);
    }
  }

  /**
   * Emite un evento Socket.IO cuando se crea un nuevo pedido
   * Y envía una Push Notification (Sistema Híbrido)
   */
  private async emitNewOrderEvent(order: Order): Promise<void> {
    try {
      const orderData = {
        orderId: order.id,
        orderNumber: order.id.substring(0, 8), // Primeros 8 caracteres del ID
        restaurantName: order.restaurant?.name || 'Desconocido',
        totalAmount: Number(order.total) || 0,
        deliveryAddress: order.deliveryAddress || 'Sin dirección',
        restaurantId: order.restaurant?.id,
        status: order.status,
      };

      // 1. Emitir evento Socket.IO (para usuarios con app abierta)
      this.deliveryGateway.server.emit('new-order-available', orderData);
      console.log(
        `✅ [Socket.IO] Evento 'new-order-available' emitido para pedido ${order.id}`,
      );

      // 2. Emitir evento de pedido creado (notificación automática vía event listener)
      if (
        order.restaurant?.owner?.id &&
        order.client?.id &&
        order.restaurant?.id
      ) {
        this.eventEmitter.emit(
          'order.created',
          new OrderCreatedEvent(
            order.id,
            orderData.orderNumber,
            order.client.id,
            order.restaurant.id,
            order.restaurant.owner.id,
            orderData.totalAmount,
            order.client.name || 'Cliente',
            orderData.deliveryAddress || 'Dirección no especificada',
          ),
        );
        console.log(
          `✅ [Event] Evento 'order.created' emitido para pedido ${order.id}`,
        );
      }
    } catch (error) {
      console.error('Error en emitNewOrderEvent:', error);
    }
  }
}
