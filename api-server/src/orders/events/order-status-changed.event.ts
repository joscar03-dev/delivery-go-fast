/**
 * Evento que se dispara cuando el estado de un pedido cambia
 * Este evento se usa para enviar notificaciones automáticas
 */
export class OrderStatusChangedEvent {
  constructor(
    public readonly orderId: string,
    public readonly orderNumber: string,
    public readonly userId: string,
    public readonly restaurantId: string,
    public readonly restaurantOwnerId: string,
    public readonly restaurantName: string,
    public readonly oldStatus: string,
    public readonly newStatus: string,
    public readonly driverId?: string,
    public readonly totalAmount?: number,
    public readonly customerName?: string,
  ) {}
}
