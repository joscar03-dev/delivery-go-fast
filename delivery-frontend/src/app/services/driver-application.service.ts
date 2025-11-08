import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  DriverApplication,
  CreateDriverApplicationDto,
  UpdateDriverApplicationDto,
  ApplicationStatus,
} from '../models/driver-application.model';

@Injectable({
  providedIn: 'root',
})
export class DriverApplicationService {
  private apiUrl = `${environment.apiUrl}/driver-applications`;

  constructor(private http: HttpClient) {}

  // Crear solicitud inicial (solo DNI, tipo vehículo, fecha nacimiento)
  create(dto: CreateDriverApplicationDto): Observable<DriverApplication> {
    return this.http.post<DriverApplication>(this.apiUrl, dto);
  }

  // Actualizar solicitud (agregar datos opcionales)
  update(
    id: string,
    dto: UpdateDriverApplicationDto
  ): Observable<DriverApplication> {
    return this.http.patch<DriverApplication>(`${this.apiUrl}/${id}`, dto);
  }

  // Enviar Paso 1 para que admin llame
  submitStep1(id: string): Observable<DriverApplication> {
    return this.http.post<DriverApplication>(
      `${this.apiUrl}/${id}/submit-step1`,
      {}
    );
  }

  // Enviar Paso 2 (solicitud completa) para revisión final
  submitStep2(id: string): Observable<DriverApplication> {
    return this.http.post<DriverApplication>(
      `${this.apiUrl}/${id}/submit-step2`,
      {}
    );
  }

  // Obtener mi solicitud
  getMyApplication(): Observable<DriverApplication> {
    return this.http.get<DriverApplication>(`${this.apiUrl}/my-application`);
  }

  // Admin: Listar todas las solicitudes
  getAll(status?: ApplicationStatus): Observable<DriverApplication[]> {
    let url = this.apiUrl;
    if (status) {
      url += `?status=${status}`;
    }
    return this.http.get<DriverApplication[]>(url);
  }

  // Admin: Ver detalle
  getById(id: string): Observable<DriverApplication> {
    return this.http.get<DriverApplication>(`${this.apiUrl}/${id}`);
  }

  // Admin: Aprobar llamada y permitir paso 2
  approveCall(id: string): Observable<DriverApplication> {
    return this.http.post<DriverApplication>(
      `${this.apiUrl}/${id}/approve-call`,
      {}
    );
  }

  // Admin: Aprobar/Rechazar solicitud final
  updateStatus(
    id: string,
    status: ApplicationStatus,
    rejectionReason?: string
  ): Observable<DriverApplication> {
    return this.http.patch<DriverApplication>(`${this.apiUrl}/${id}/status`, {
      status,
      rejectionReason,
    });
  }
}
