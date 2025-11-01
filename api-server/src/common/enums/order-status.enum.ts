export enum OrderStatus {
  PENDING = 'pending', // Orden creada, esperando confirmación del restaurante
  CONFIRMED = 'confirmed', // Restaurante aceptó y empieza a cocinar (drivers pueden ver)
  PREPARING = 'preparing', // Driver asignado, restaurante cocinando
  READY_FOR_PICKUP = 'ready_for_pickup', // Comida lista, esperando que driver recoja
  OUT_FOR_DELIVERY = 'out_for_delivery', // Driver recogió y va en camino al cliente
  DELIVERED = 'delivered', // El cliente recibió la orden
  CANCELLED = 'cancelled', // Orden cancelada
}
