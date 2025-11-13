import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { RestaurantDashboard } from '../models/restaurant-dashboard.model';

@Injectable({
  providedIn: 'root',
})
export class RestaurantDashboardService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/restaurants`;

  /**
   * Obtiene los datos del dashboard de un restaurante
   */
  getDashboardData(
    restaurantId: string,
    period: 'today' | 'week' | 'month' | 'all' = 'all'
  ): Observable<RestaurantDashboard> {
    return this.http.get<RestaurantDashboard>(
      `${this.baseUrl}/${restaurantId}/dashboard`,
      { params: { period } }
    );
  }
}
