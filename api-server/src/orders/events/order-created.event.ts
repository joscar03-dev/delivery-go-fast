/**
 * Evento que se dispara cuando se crea un nuevo pedido
 * Se usa para notificar al restaurante sobre el nuevo pedido
 */
export class OrderCreatedEvent {
  constructor(
    public readonly orderId: string,
    public readonly orderNumber: string,
    public readonly userId: string,
    public readonly restaurantId: string,
    public readonly restaurantOwnerId: string,
    public readonly totalAmount: number,
    public readonly customerName: string,
    public readonly deliveryAddress: string,
  ) {}
}
