import { OrderPayment } from '../entities/order-payment.entity';

/**
 * Respuesta de consulta de pago.
 *
 * Se expone la entidad cruda, y con ella las relaciones `order` y `verifier`.
 * Ninguna de las dos se carga hoy, pero ambas son un salto de codigo de un
 * `relations` en el repositorio a filtrar password_hash y la direccion del
 * cliente. Mapear a mano deja el estado seguro por defecto.
 *
 * Los campos si se exponen todos: el dueño necesita transactionReference y
 * paymentProofUrl para verificar un Yape/Plin contra lo que pagó el cliente.
 */
export class OrderPaymentResponseDto {
  id: string;
  orderId: string;
  paymentMethodCode: string;
  paymentStatus: string;
  amount: number;
  subtotal: number;
  deliveryFee: number;
  cashAmount?: number;
  changeAmount?: number;
  cardBrand?: string;
  cardLastDigits?: string;
  transactionId?: string;
  transactionReference?: string;
  paymentProofUrl?: string;
  notes?: string;
  verifiedAt?: Date;
  verifiedBy?: string;
  createdAt: Date;
  updatedAt: Date;

  static from(payment: OrderPayment): OrderPaymentResponseDto {
    return {
      id: payment.id,
      orderId: payment.orderId,
      paymentMethodCode: payment.paymentMethodCode,
      paymentStatus: payment.paymentStatus,
      amount: payment.amount,
      subtotal: payment.subtotal,
      deliveryFee: payment.deliveryFee,
      cashAmount: payment.cashAmount,
      changeAmount: payment.changeAmount,
      cardBrand: payment.cardBrand,
      cardLastDigits: payment.cardLastDigits,
      transactionId: payment.transactionId,
      transactionReference: payment.transactionReference,
      paymentProofUrl: payment.paymentProofUrl,
      notes: payment.notes,
      verifiedAt: payment.verifiedAt,
      verifiedBy: payment.verifiedBy,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}
