export enum OrderStatus {
  PENDING = 'pending', // Orden creada, esperando pago/confirmación
  CONFIRMED = 'confirmed', // Orden confirmada por el restaurante
  PREPARING = 'preparing', // La cocina está trabajando en la orden
  OUT_FOR_DELIVERY = 'out_for_delivery', // El repartidor va en camino
  DELIVERED = 'delivered', // El cliente recibió la orden
  CANCELLED = 'cancelled', // Orden cancelada
}
