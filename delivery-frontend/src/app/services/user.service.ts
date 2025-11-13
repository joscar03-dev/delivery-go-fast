import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type { User } from '../models/user.model';

export type RoleName = 'client' | 'driver' | 'restaurant_owner' | 'super_admin';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private base = environment.apiUrl.replace(/\/$/, '');

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.base}/users/me`);
  }

  // 🆕 Actualizar propio perfil
  updateMyProfile(data: { name?: string; email?: string }): Observable<User> {
    return this.http.patch<User>(`${this.base}/users/me`, data);
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/users`);
  }

  /**
   * Obtener todos los usuarios incluyendo inactivos (Solo admin)
   */
  getAllUsersForAdmin(): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/users/admin/all`);
  }

  updateUser(
    id: string,
    data: Partial<User> & { password?: string; role?: RoleName }
  ): Observable<User> {
    return this.http.patch<User>(`${this.base}/users/${id}`, data);
  }

  /**
   * Activar o desactivar un usuario
   */
  toggleActive(id: string, isActive: boolean): Observable<User> {
    return this.http.patch<User>(`${this.base}/users/${id}/toggle-active`, {
      isActive,
    });
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/users/${id}`);
  }

  // Crear usuario desde Admin usando el endpoint de auth/register (acepta rol opcional)
  createUser(data: {
    name: string;
    email: string;
    password: string;
    role: RoleName;
  }): Observable<any> {
    return this.http.post<any>(`${this.base}/auth/register`, data);
  }
}
