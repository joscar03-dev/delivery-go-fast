export enum PaymentMethodCode {
  CASH = 'cash',
  CARD = 'card',
  YAPE = 'yape',
  PLIN = 'plin',
}

export enum PaymentStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  FAILED = 'failed',
}

export interface PaymentMethod {
  id: string;
  code: PaymentMethodCode;
  name: string;
  description?: string;
  isActive: boolean;
  iconUrl?: string;
  createdAt: string;
}

export interface OrderPayment {
  id: string;
  orderId: string;
  paymentMethodCode: PaymentMethodCode;
  amount: number; // Total a pagar (subtotal + delivery)
  deliveryFee: number;
  subtotal: number;

  // Efectivo
  cashAmount?: number; // Con cuánto paga
  changeAmount?: number; // Vuelto

  // Yape/Plin
  transactionReference?: string; // Número de operación
  paymentProofUrl?: string; // Screenshot de comprobante

  // Tarjeta
  cardLastDigits?: string;
  cardBrand?: string;
  transactionId?: string;

  paymentStatus: PaymentStatus;
  verifiedAt?: string;
  verifiedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantDeliveryConfig {
  id: string;
  restaurantId: string;
  deliveryFee: number;
  freeDeliveryThreshold?: number; // Delivery gratis si el pedido supera este monto
  minOrderAmount?: number; // Monto mínimo de pedido
  maxDeliveryDistance?: number; // km
  estimatedDeliveryTime?: number; // minutos
  isDeliveryEnabled: boolean;
  deliveryType?: 'none' | 'restaurant' | 'platform'; // Nuevo campo
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderPaymentDto {
  orderId: string;
  paymentMethodCode: PaymentMethodCode;
  amount: number;
  deliveryFee: number;
  subtotal: number;

  // Opcional según método de pago
  cashAmount?: number;
  transactionReference?: string;
  paymentProofUrl?: string;
  notes?: string;
}

export interface CheckoutSummary {
  subtotal: number;
  deliveryFee: number;
  total: number;
  restaurant: {
    id: string;
    name: string;
    deliveryConfig: RestaurantDeliveryConfig;
  };
  itemsCount: number;
}

// DTOs para el checkout
export interface CheckoutItemDto {
  menuItemId: string;
  quantity: number;
  selectedOptions?: string[]; // IDs de las opciones seleccionadas
  specialInstructions?: string;
}

export interface CheckoutDto {
  restaurantId: string;
  deliveryAddressId: string;
  items: CheckoutItemDto[];
  paymentMethodCode: PaymentMethodCode;

  // Campos específicos para efectivo
  cashAmount?: number;

  // Campos específicos para Yape/Plin
  transactionReference?: string;
  paymentProofUrl?: string;

  notes?: string;
}
