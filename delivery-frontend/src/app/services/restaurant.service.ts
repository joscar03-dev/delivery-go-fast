import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import type { RestaurantModel } from '../models/restaurant.model';

export type CreateRestaurantDto = {
  name: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  restaurantCategoryId?: string;
  ownerId?: string; // requerido para SUPER_ADMIN, auto para RESTAURANT_OWNER
};

export type UpdateRestaurantDto = Partial<CreateRestaurantDto>;

export type CreateMenuItemDto = {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  menuCategoryId?: string;
};

export type UpdateMenuItemDto = Partial<CreateMenuItemDto>;

@Injectable({ providedIn: 'root' })
export class RestaurantService {
  private http = inject(HttpClient);
  private base = environment.apiUrl.replace(/\/$/, '');

  list(params?: any): Observable<RestaurantModel[]> {
    return this.http.get<RestaurantModel[]>(`${this.base}/restaurants`, {
      params,
    });
  }

  getById(id: string): Observable<RestaurantModel> {
    return this.http.get<RestaurantModel>(`${this.base}/restaurants/${id}`);
  }

  create(data: CreateRestaurantDto): Observable<RestaurantModel> {
    return this.http.post<RestaurantModel>(`${this.base}/restaurants`, data);
  }

  update(id: string, data: UpdateRestaurantDto): Observable<RestaurantModel> {
    return this.http.patch<RestaurantModel>(
      `${this.base}/restaurants/${id}`,
      data
    );
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/restaurants/${id}`);
  }

  // Menú
  listMenu(restaurantId: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.base}/restaurants/${restaurantId}/menu`
    );
  }

  getMenuItem(restaurantId: string, itemId: string): Observable<any> {
    return this.http.get<any>(
      `${this.base}/restaurants/${restaurantId}/menu/${itemId}`
    );
  }

  createMenuItem(
    restaurantId: string,
    data: CreateMenuItemDto
  ): Observable<any> {
    return this.http.post<any>(
      `${this.base}/restaurants/${restaurantId}/menu`,
      data
    );
  }

  updateMenuItem(
    restaurantId: string,
    itemId: string,
    data: UpdateMenuItemDto
  ): Observable<any> {
    return this.http.patch<any>(
      `${this.base}/restaurants/${restaurantId}/menu/${itemId}`,
      data
    );
  }

  removeMenuItem(restaurantId: string, itemId: string): Observable<void> {
    // Nota: el backend usa /menu-items en delete
    return this.http.delete<void>(
      `${this.base}/restaurants/${restaurantId}/menu-items/${itemId}`
    );
  }

  // Categorías de restaurantes (require auth)
  listRestaurantCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/restaurant-categories`);
  }

  getRestaurantCategory(id: string): Observable<any> {
    return this.http.get<any>(`${this.base}/restaurant-categories/${id}`);
  }

  createRestaurantCategory(data: {
    name: string;
    description?: string;
    icon?: string;
    isActive?: boolean;
  }): Observable<any> {
    return this.http.post<any>(`${this.base}/restaurant-categories`, data);
  }

  updateRestaurantCategory(
    id: string,
    data: Partial<{
      name: string;
      description?: string;
      icon?: string;
      isActive?: boolean;
    }>
  ): Observable<any> {
    return this.http.patch<any>(
      `${this.base}/restaurant-categories/${id}`,
      data
    );
  }

  removeRestaurantCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/restaurant-categories/${id}`);
  }

  deactivateRestaurantCategory(id: string): Observable<any> {
    return this.http.patch<any>(
      `${this.base}/restaurant-categories/${id}/deactivate`,
      {}
    );
  }

  // Categorías de menú por restaurante
  listMenuCategories(restaurantId: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.base}/restaurants/${restaurantId}/menu-categories`
    );
  }

  createMenuCategory(
    restaurantId: string,
    data: {
      name: string;
      description?: string;
      sortOrder?: number;
      isActive?: boolean;
    }
  ): Observable<any> {
    return this.http.post<any>(
      `${this.base}/restaurants/${restaurantId}/menu-categories`,
      data
    );
  }

  updateMenuCategory(
    restaurantId: string,
    id: string,
    data: Partial<{
      name: string;
      description?: string;
      sortOrder?: number;
      isActive?: boolean;
    }>
  ): Observable<any> {
    return this.http.patch<any>(
      `${this.base}/restaurants/${restaurantId}/menu-categories/${id}`,
      data
    );
  }

  removeMenuCategory(restaurantId: string, id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.base}/restaurants/${restaurantId}/menu-categories/${id}`
    );
  }

  deactivateMenuCategory(restaurantId: string, id: string): Observable<any> {
    return this.http.patch<any>(
      `${this.base}/restaurants/${restaurantId}/menu-categories/${id}/deactivate`,
      {}
    );
  }
}
