import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethod } from './entities/payment-method.entity';
import { RestaurantDeliveryConfig } from './entities/restaurant-delivery-config.entity';
import { OrderPayment } from './entities/order-payment.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentMethod)
    private paymentMethodRepo: Repository<PaymentMethod>,
    @InjectRepository(RestaurantDeliveryConfig)
    private deliveryConfigRepo: Repository<RestaurantDeliveryConfig>,
    @InjectRepository(OrderPayment)
    private orderPaymentRepo: Repository<OrderPayment>,
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
   * Verificar un pago (para admin/restaurante)
   */
  async verifyPayment(
    orderId: string,
    status: 'pending' | 'verified' | 'failed',
    verifiedBy: string,
    notes?: string,
  ): Promise<OrderPayment> {
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
    payment.verifiedBy = verifiedBy;

    if (notes) {
      payment.notes = notes;
    }

    return this.orderPaymentRepo.save(payment);
  }

  /**
   * Obtener información de pago de una orden
   */
  async getOrderPayment(orderId: string): Promise<OrderPayment> {
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
