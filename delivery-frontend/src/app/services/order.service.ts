import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Order, CreateOrderDto, OrderHistoryResponse } from '../models/order.model';
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

    return this.http.get<OrderHistoryResponse>(this.apiUrl, {
      headers: this.getHeaders(),
    }).pipe(
      map(response => {
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
}
