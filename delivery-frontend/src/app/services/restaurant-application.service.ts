import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  RestaurantApplication,
  CreateRestaurantApplicationDto,
} from '../models/restaurant-application.model';

@Injectable({
  providedIn: 'root',
})
export class RestaurantApplicationService {
  private apiUrl = `${environment.apiUrl}/restaurant-applications`;
  private adminApiUrl = `${environment.apiUrl}/admin/restaurant-applications`;

  constructor(private http: HttpClient) {}

  // ==================== USER ENDPOINTS ====================

  /**
   * Crear solicitud de restaurante (requiere login)
   */
  create(
    dto: CreateRestaurantApplicationDto
  ): Observable<RestaurantApplication> {
    return this.http.post<RestaurantApplication>(this.apiUrl, dto);
  }

  /**
   * Obtener mi solicitud
   */
  getMyApplication(): Observable<RestaurantApplication | null> {
    return this.http.get<RestaurantApplication | null>(
      `${this.apiUrl}/my-application`
    );
  }

  /**
   * Obtener solicitud por ID
   */
  getById(id: string): Observable<RestaurantApplication> {
    return this.http.get<RestaurantApplication>(`${this.apiUrl}/${id}`);
  }

  // ==================== ADMIN ENDPOINTS ====================

  /**
   * Obtener todas las solicitudes (Admin)
   */
  getAllAdmin(): Observable<RestaurantApplication[]> {
    return this.http.get<RestaurantApplication[]>(this.adminApiUrl);
  }

  /**
   * Obtener estadísticas (Admin)
   */
  getStats(): Observable<{
    total: number;
    pending: number;
    underReview: number;
    approved: number;
    rejected: number;
  }> {
    return this.http.get<any>(`${this.adminApiUrl}/stats`);
  }

  /**
   * Obtener solicitud por ID (Admin)
   */
  getByIdAdmin(id: string): Observable<RestaurantApplication> {
    return this.http.get<RestaurantApplication>(`${this.adminApiUrl}/${id}`);
  }

  /**
   * Actualizar estado (Admin)
   */
  updateStatus(
    id: string,
    status: string,
    adminNotes?: string
  ): Observable<RestaurantApplication> {
    return this.http.patch<RestaurantApplication>(
      `${this.adminApiUrl}/${id}/status`,
      { status, adminNotes }
    );
  }

  /**
   * Aprobar y crear restaurante (Admin)
   */
  approveAndCreateRestaurant(
    id: string,
    adminNotes?: string
  ): Observable<RestaurantApplication> {
    return this.http.post<RestaurantApplication>(
      `${this.adminApiUrl}/${id}/approve`,
      { adminNotes }
    );
  }

  /**
   * Rechazar solicitud (Admin)
   */
  reject(id: string, reason: string): Observable<RestaurantApplication> {
    return this.http.post<RestaurantApplication>(
      `${this.adminApiUrl}/${id}/reject`,
      { reason }
    );
  }

  /**
   * Eliminar solicitud (Admin)
   */
  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.adminApiUrl}/${id}`);
  }
}
