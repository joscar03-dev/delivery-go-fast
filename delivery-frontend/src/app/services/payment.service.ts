import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  PaymentMethod,
  RestaurantDeliveryConfig,
  OrderPayment,
  CheckoutSummary,
} from '../models/payment.model';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/payments`;

  /**
   * Obtener métodos de pago disponibles
   */
  getAvailablePaymentMethods(): Observable<PaymentMethod[]> {
    return this.http.get<PaymentMethod[]>(`${this.apiUrl}/methods`);
  }

  /**
   * Obtener configuración de delivery de un restaurante
   */
  getRestaurantDeliveryConfig(
    restaurantId: string
  ): Observable<RestaurantDeliveryConfig> {
    return this.http.get<RestaurantDeliveryConfig>(
      `${this.apiUrl}/restaurants/${restaurantId}/delivery-config`
    );
  }

  /**
   * Obtener información de pago de una orden
   */
  getOrderPayment(orderId: string): Observable<OrderPayment> {
    return this.http.get<OrderPayment>(`${this.apiUrl}/orders/${orderId}`);
  }

  /**
   * Verificar un pago (admin/restaurante)
   */
  verifyPayment(
    orderId: string,
    status: 'pending' | 'verified' | 'failed',
    notes?: string
  ): Observable<OrderPayment> {
    return this.http.post<OrderPayment>(`${this.apiUrl}/verify`, {
      orderId,
      status,
      notes,
    });
  }

  /**
   * Calcular el vuelto para pago en efectivo
   */
  calculateChange(cashAmount: number, total: number): number {
    if (cashAmount < total) {
      return 0;
    }
    return cashAmount - total;
  }

  /**
   * Validar que el monto en efectivo sea suficiente
   */
  validateCashPayment(
    cashAmount: number,
    total: number
  ): { isValid: boolean; message: string } {
    if (cashAmount < total) {
      const missing = total - cashAmount;
      return {
        isValid: false,
        message: `Monto insuficiente. Faltan S/ ${missing.toFixed(2)}`,
      };
    }
    return {
      isValid: true,
      message: 'Monto válido',
    };
  }
}
