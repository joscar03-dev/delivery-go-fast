import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Address,
  CreateAddressDto,
  UpdateAddressDto,
} from '../models/address.model';

@Injectable({
  providedIn: 'root',
})
export class AddressService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/users/addresses`;

  /**
   * Obtiene todas las direcciones del usuario autenticado
   */
  getMyAddresses(): Observable<Address[]> {
    return this.http.get<Address[]>(this.baseUrl);
  }

  /**
   * Obtiene una dirección específica por ID
   */
  getAddressById(id: string): Observable<Address> {
    return this.http.get<Address>(`${this.baseUrl}/${id}`);
  }

  /**
   * Crea una nueva dirección
   */
  createAddress(data: CreateAddressDto): Observable<Address> {
    return this.http.post<Address>(this.baseUrl, data);
  }

  /**
   * Actualiza una dirección existente
   */
  updateAddress(id: string, data: UpdateAddressDto): Observable<Address> {
    return this.http.put<Address>(`${this.baseUrl}/${id}`, data);
  }

  /**
   * Elimina una dirección
   */
  deleteAddress(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Establece una dirección como predeterminada
   */
  setDefaultAddress(id: string): Observable<Address> {
    return this.http.patch<Address>(`${this.baseUrl}/${id}/set-default`, {});
  }
}
