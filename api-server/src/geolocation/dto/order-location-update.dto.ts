export class OrderLocationUpdateDto {
  orderId: string;
  driverId: string;
  driverName: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  estimatedArrival?: Date;
  status: string; // Estado del pedido
}
