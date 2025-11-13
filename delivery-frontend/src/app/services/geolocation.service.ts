import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CheckCoverageDto {
  latitude: number;
  longitude: number;
}

export interface CoverageResponse {
  isInCoverage: boolean;
  message: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class GeolocationService {
  private apiUrl = `${environment.apiUrl}/geolocation`;

  constructor(private http: HttpClient) {}

  /**
   * Verifica si una ubicación está dentro de la zona de cobertura del servicio
   * No requiere autenticación - Endpoint público
   *
   * @param latitude Latitud de la ubicación a verificar
   * @param longitude Longitud de la ubicación a verificar
   * @returns Observable con el resultado de la validación
   */
  checkCoverage(
    latitude: number,
    longitude: number
  ): Observable<CoverageResponse> {
    const payload: CheckCoverageDto = { latitude, longitude };
    return this.http.post<CoverageResponse>(
      `${this.apiUrl}/check-coverage`,
      payload
    );
  }
}
