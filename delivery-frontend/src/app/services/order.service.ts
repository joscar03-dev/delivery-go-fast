import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Order,
  CreateOrderDto,
  OrderHistoryResponse,
} from '../models/order.model';
import { CheckoutDto } from '../models/payment.model';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getAccessToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  createOrder(orderData: CreateOrderDto): Observable<Order> {
    return this.http.post<Order>(this.apiUrl, orderData, {
      headers: this.getHeaders(),
    });
  }

  getOrderHistory(): Observable<Order[]> {
    console.log('OrderService: Haciendo petición a:', this.apiUrl);
    console.log('OrderService: Headers:', this.getHeaders());

    return this.http
      .get<OrderHistoryResponse>(this.apiUrl, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((response) => {
          console.log('OrderService: Respuesta completa:', response);
          return response.orders || [];
        })
      );
  }

  getOrderDetail(orderId: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${orderId}`, {
      headers: this.getHeaders(),
    });
  }

  updateOrderStatus(orderId: string, status: string): Observable<Order> {
    return this.http.patch<Order>(
      `${this.apiUrl}/${orderId}`,
      { status },
      {
        headers: this.getHeaders(),
      }
    );
  }

  cancelOrder(orderId: string): Observable<Order> {
    return this.http.patch<Order>(
      `${this.apiUrl}/${orderId}`,
      { status: 'cancelled' },
      {
        headers: this.getHeaders(),
      }
    );
  }

  // Métodos específicos para RESTAURANT_OWNER

  /**
   * Confirma un pedido con tiempo estimado de preparación
   */
  confirmOrder(orderId: string, estimatedPrepTime: number): Observable<Order> {
    return this.http.patch<Order>(
      `${this.apiUrl}/${orderId}/confirm`,
      { estimatedPrepTime },
      {
        headers: this.getHeaders(),
      }
    );
  }

  /**
   * Marca un pedido como en preparación (cambia estado de CONFIRMED a PREPARING)
   */
  startPreparing(orderId: string): Observable<Order> {
    return this.http.patch<Order>(
      `${this.apiUrl}/${orderId}/preparing`,
      {},
      {
        headers: this.getHeaders(),
      }
    );
  }

  /**
   * Marca un pedido como listo para recoger
   */
  markAsReadyForPickup(orderId: string): Observable<Order> {
    return this.http.patch<Order>(
      `${this.apiUrl}/${orderId}/ready-for-pickup`,
      {},
      {
        headers: this.getHeaders(),
      }
    );
  }

  /**
   * Asigna un driver a un pedido (para delivery propio del restaurante)
   */
  assignDriverToOrder(orderId: string, driverId: string): Observable<Order> {
    return this.http.patch<Order>(
      `${this.apiUrl}/${orderId}/assign-restaurant-driver`,
      { driverId },
      {
        headers: this.getHeaders(),
      }
    );
  }

  /**
   * Ajusta el tiempo de preparación agregando minutos adicionales
   */
  adjustPrepTime(
    orderId: string,
    additionalMinutes: number
  ): Observable<Order> {
    return this.http.patch<Order>(
      `${this.apiUrl}/${orderId}/adjust-prep-time`,
      { additionalMinutes },
      {
        headers: this.getHeaders(),
      }
    );
  }

  /**
   * Obtiene pedidos filtrados por estado (para restaurant owner)
   */
  getOrdersByStatus(
    status?: string,
    restaurantId?: string
  ): Observable<Order[]> {
    let url = this.apiUrl;
    const params: string[] = [];

    if (status) {
      params.push(`status=${status}`);
    }
    if (restaurantId) {
      params.push(`restaurantId=${restaurantId}`);
    }

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    return this.http
      .get<OrderHistoryResponse>(url, {
        headers: this.getHeaders(),
      })
      .pipe(map((response) => response.orders || []));
  }

  /**
   * Realiza el checkout completo del carrito
   * Crea el pedido con dirección, método de pago y cálculo de delivery
   */
  checkout(checkoutData: CheckoutDto): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/checkout`, checkoutData, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Envía la encuesta POST de satisfacción para un pedido entregado
   * @param orderId ID del pedido
   * @param surveyData Respuestas de la encuesta (11 preguntas)
   */
  submitSurvey(
    orderId: string,
    surveyData: {
      q1AppLoadingSpeed: number;
      q2ProductSelectionEase: number;
      q3MenuNavigationEase: number;
      q4OrderAccuracy: number;
      q5PaymentAddressAccuracy: number;
      q6OrderTrackingVisibility: number;
      q7CommunicationNeed: number;
      q8DeliveryTimeliness: number;
      q9AppVsPhoneSpeed: number;
      q10OverallSatisfaction: number;
      q11RecommendationLikelihood: number;
      comment?: string;
    }
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/${orderId}/review`, surveyData, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Obtiene los pedidos entregados que aún no tienen review (encuestas pendientes)
   * Solo para clientes
   */
  getPendingReviews(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/pending-reviews`, {
      headers: this.getHeaders(),
    });
  }
}
