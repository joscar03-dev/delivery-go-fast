import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethod } from './entities/payment-method.entity';
import { RestaurantDeliveryConfig } from './entities/restaurant-delivery-config.entity';
import { OrderPayment } from './entities/order-payment.entity';
import { Order } from '../orders/entities/order.entity';
import { Role } from '../common/enums/role.enum';

/** Identidad mínima necesaria para autorizar la gestión de pagos de un pedido. */
export interface PaymentActor {
  id: string;
  role: string;
}

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentMethod)
    private paymentMethodRepo: Repository<PaymentMethod>,
    @InjectRepository(RestaurantDeliveryConfig)
    private deliveryConfigRepo: Repository<RestaurantDeliveryConfig>,
    @InjectRepository(OrderPayment)
    private orderPaymentRepo: Repository<OrderPayment>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
  ) {}

  /**
   * Obtener todos los métodos de pago disponibles
   */
  async getAvailablePaymentMethods(): Promise<PaymentMethod[]> {
    return this.paymentMethodRepo.find({
      where: { isActive: true },
      order: { code: 'ASC' },
    });
  }

  /**
   * Obtener configuración de delivery de un restaurante
   */
  async getRestaurantDeliveryConfig(
    restaurantId: string,
  ): Promise<RestaurantDeliveryConfig> {
    const config = await this.deliveryConfigRepo.findOne({
      where: { restaurantId },
    });

    if (!config) {
      throw new NotFoundException(
        `No se encontró configuración de delivery para el restaurante ${restaurantId}`,
      );
    }

    return config;
  }

  /**
   * Calcular tarifa de delivery
   * Aplica delivery gratis si el subtotal supera el umbral
   */
  async calculateDeliveryFee(
    restaurantId: string,
    subtotal: number,
  ): Promise<number> {
    const config = await this.getRestaurantDeliveryConfig(restaurantId);

    // Si no tiene delivery habilitado
    if (!config.isDeliveryEnabled) {
      throw new Error('El restaurante no tiene delivery habilitado');
    }

    // Delivery gratis si supera el umbral
    if (
      config.freeDeliveryThreshold &&
      subtotal >= config.freeDeliveryThreshold
    ) {
      return 0;
    }

    // Asegurar que devolvemos un número
    return Number(config.deliveryFee);
  }

  /**
   * Crear registro de pago para una orden
   */
  async createOrderPayment(
    orderId: string,
    paymentMethodCode: string,
    amount: number,
    deliveryFee: number,
    subtotal: number,
    options?: {
      cashAmount?: number;
      changeAmount?: number;
      transactionReference?: string;
      paymentProofUrl?: string;
      notes?: string;
    },
  ): Promise<OrderPayment> {
    const payment = this.orderPaymentRepo.create({
      orderId,
      paymentMethodCode,
      amount,
      deliveryFee,
      subtotal,
      cashAmount: options?.cashAmount,
      changeAmount: options?.changeAmount,
      transactionReference: options?.transactionReference,
      paymentProofUrl: options?.paymentProofUrl,
      notes: options?.notes,
      paymentStatus: 'pending',
    });

    // Si es efectivo, auto-verificar
    if (paymentMethodCode === 'cash') {
      payment.paymentStatus = 'verified';
      payment.verifiedAt = new Date();
    }

    return this.orderPaymentRepo.save(payment);
  }

  /**
   * Autoriza la gestión de pagos de un pedido.
   *
   * Solo un super admin o el dueño del restaurante del pedido pueden operar sobre
   * sus pagos. El dueño se valida contra `restaurants.owner_id` del pedido, nunca
   * contra un dato enviado por el cliente.
   *
   * Cuando el pedido existe pero no pertenece al actor se responde 404 y no 403,
   * para no confirmar la existencia de pedidos ajenos.
   */
  async assertCanManageOrderPayment(
    orderId: string,
    actor: PaymentActor,
  ): Promise<void> {
    if (
      actor.role !== Role.SUPER_ADMIN &&
      actor.role !== Role.RESTAURANT_OWNER
    ) {
      throw new ForbiddenException(
        'Solo un super admin o el dueño del restaurante puede gestionar los pagos de un pedido',
      );
    }

    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: { restaurant: { owner: true } },
    });

    if (!order) {
      throw new NotFoundException(`No se encontró el pedido ${orderId}`);
    }

    if (actor.role === Role.SUPER_ADMIN) {
      return;
    }

    if (order.restaurant?.owner?.id !== actor.id) {
      throw new NotFoundException(`No se encontró el pedido ${orderId}`);
    }
  }

  /**
   * Verificar un pago (para admin/restaurante)
   *
   * `actor` proviene del access token validado; no se acepta un `verifiedBy`
   * arbitrario para que la auditoría no sea falsificable desde el cliente.
   */
  async verifyPayment(
    orderId: string,
    status: 'pending' | 'verified' | 'failed',
    actor: PaymentActor,
    notes?: string,
  ): Promise<OrderPayment> {
    await this.assertCanManageOrderPayment(orderId, actor);

    const payment = await this.orderPaymentRepo.findOne({
      where: { orderId },
    });

    if (!payment) {
      throw new NotFoundException(
        `No se encontró información de pago para la orden ${orderId}`,
      );
    }

    payment.paymentStatus = status;
    payment.verifiedAt = new Date();
    payment.verifiedBy = actor.id;

    if (notes) {
      payment.notes = notes;
    }

    return this.orderPaymentRepo.save(payment);
  }

  /**
   * Obtener información de pago de una orden
   */
  async getOrderPayment(
    orderId: string,
    actor: PaymentActor,
  ): Promise<OrderPayment> {
    await this.assertCanManageOrderPayment(orderId, actor);

    const payment = await this.orderPaymentRepo.findOne({
      where: { orderId },
    });

    if (!payment) {
      throw new NotFoundException(
        `No se encontró información de pago para la orden ${orderId}`,
      );
    }

    return payment;
  }

  /**
   * Validar que el monto en efectivo sea suficiente
   */
  validateCashPayment(cashAmount: number, total: number): number {
    if (cashAmount < total) {
      throw new Error(
        `El monto en efectivo ($${cashAmount}) debe ser mayor o igual al total ($${total})`,
      );
    }

    return cashAmount - total; // Retorna el vuelto
  }
}
