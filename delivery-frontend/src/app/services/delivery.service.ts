import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface AvailableDeliveriesResponse {
  orders: DeliveryOrder[];
  total: number;
}
export interface DeliveryOrder {
  id: string;
  status: string;
  total: number; // El backend retorna 'total', no 'totalAmount'
  notes: string | null;
  deliveryAddress: string | null;
  estimatedPrepTime?: number;
  estimatedReadyTime?: string;
  confirmedAt?: string;
  restaurant: {
    id: string;
    name: string;
    address: string;
    phone: string;
    imageUrl?: string;
    location?: {
      type: string;
      coordinates: [number, number];
    };
  };
  client?: {
    id: string;
    name: string;
    email: string;
  };
  driver?: {
    id: string;
    name: string;
    email: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    menuItem: {
      id: string;
      name: string;
      description?: string;
      price?: number;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface AcceptDeliveryResponse {
  order: DeliveryOrder;
  message: string;
}

export enum OrderStatus {
  PENDING = 'pending', // Orden creada, esperando confirmación del restaurante
  CONFIRMED = 'confirmed', // Restaurante aceptó y empieza a cocinar (drivers pueden ver)
  PREPARING = 'preparing', // Driver asignado, restaurante cocinando
  READY_FOR_PICKUP = 'ready_for_pickup', // Comida lista, esperando que driver recoja
  OUT_FOR_DELIVERY = 'out_for_delivery', // Driver recogió y va en camino al cliente
  DELIVERED = 'delivered', // El cliente recibió la orden
  CANCELLED = 'cancelled', // Orden cancelada
}

@Injectable({
  providedIn: 'root',
})
export class DeliveryService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/deliveries`;

  /**
   * Obtiene la lista de pedidos disponibles para ser asignados a repartidores
   */
  getAvailableDeliveries(): Observable<DeliveryOrder[]> {
    return this.http
      .get<AvailableDeliveriesResponse>(`${this.baseUrl}/available`) // <-- 3. Espera el objeto
      .pipe(
        map((response) => response.orders || []) // <-- 4. Extrae solo el array 'orders'
      );
  }

  /**
   * Obtiene la lista de pedidos PENDING para que drivers puedan planificar
   * (solo lectura, no pueden aceptarlos hasta que restaurant confirme)
   */
  getPendingDeliveries(): Observable<DeliveryOrder[]> {
    return this.http
      .get<AvailableDeliveriesResponse>(`${this.baseUrl}/pending`)
      .pipe(map((response) => response.orders || []));
  }

  /**
   * Acepta un pedido como repartidor
   * El backend retorna directamente el Order, lo mapeamos al formato esperado
   */
  acceptDelivery(orderId: string): Observable<AcceptDeliveryResponse> {
    return this.http
      .post<DeliveryOrder>(`${this.baseUrl}/${orderId}/accept`, {})
      .pipe(
        map((order) => ({
          order,
          message: 'Pedido aceptado exitosamente',
        }))
      );
  }

  /**
   * Obtiene todos los pedidos activos del repartidor autenticado
   * Incluye pedidos en PREPARING, READY_FOR_PICKUP y OUT_FOR_DELIVERY
   */
  getMyActiveDeliveries(): Observable<DeliveryOrder[]> {
    return this.http.get<DeliveryOrder[]>(`${this.baseUrl}/my-active`);
  }

  /**
   * Obtiene un pedido específico por ID (para la página de detalle)
   */
  getDeliveryById(orderId: string): Observable<DeliveryOrder> {
    return this.http.get<DeliveryOrder>(
      `${environment.apiUrl}/orders/${orderId}`
    );
  }

  /**
   * Actualiza el estado de un pedido usando los endpoints específicos
   */
  updateOrderStatus(
    orderId: string,
    status: OrderStatus
  ): Observable<DeliveryOrder> {
    // Usar endpoints específicos según el estado
    let endpoint = '';

    switch (status) {
      case OrderStatus.OUT_FOR_DELIVERY:
        endpoint = `${environment.apiUrl}/orders/${orderId}/out-for-delivery`;
        break;
      case OrderStatus.DELIVERED:
        endpoint = `${environment.apiUrl}/orders/${orderId}/delivered`;
        break;
      default:
        // Fallback al endpoint genérico
        return this.http.put<DeliveryOrder>(
          `${environment.apiUrl}/orders/${orderId}/status`,
          { status }
        );
    }

    return this.http.patch<DeliveryOrder>(endpoint, {});
  }

  /**
   * Actualiza la ubicación del repartidor durante una entrega
   * @deprecated Este método usa HTTP pero debería usarse WebSocket.
   * Usar SocketService.sendDriverLocationUpdate() en su lugar.
   */
  updateDeliveryLocation(
    orderId: string,
    latitude: number,
    longitude: number
  ): Observable<any> {
    return this.http.post(`${this.baseUrl}/${orderId}/location`, {
      latitude,
      longitude,
    });
  }

  /**
   * Cancela una entrega en curso (solo si aún no ha sido recogida)
   */
  cancelDelivery(orderId: string, reason: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${orderId}/cancel`, { reason });
  }
}
