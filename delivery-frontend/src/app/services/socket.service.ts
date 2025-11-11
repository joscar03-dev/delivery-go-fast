import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface SocketEvent {
  event: string;
  data: any;
}

export interface NewOrderNotification {
  orderId: string;
  orderNumber: string;
  restaurantName: string;
  totalAmount: number;
  deliveryAddress: string;
}

export interface OrderStatusUpdate {
  orderId: string;
  status: string;
  previousStatus?: string;
}

export interface AuthError {
  code: string;
  message: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket?: Socket;
  private connected$ = new BehaviorSubject<boolean>(false);
  private newOrderSubject$ = new BehaviorSubject<NewOrderNotification | null>(
    null
  );
  private orderStatusUpdatedSubject$ =
    new BehaviorSubject<OrderStatusUpdate | null>(null);

  private authService = inject(AuthService);

  /**
   * Observable que emite true cuando está conectado y false cuando está desconectado
   */
  get isConnected$(): Observable<boolean> {
    return this.connected$.asObservable();
  }

  /**
   * Observable que emite cuando hay un nuevo pedido disponible
   */
  get newOrder$(): Observable<NewOrderNotification | null> {
    return this.newOrderSubject$.asObservable();
  }

  /**
   * Observable que emite cuando se actualiza el estado de un pedido
   */
  get orderStatusUpdated$(): Observable<OrderStatusUpdate | null> {
    return this.orderStatusUpdatedSubject$.asObservable();
  }

  /**
   * Conecta al servidor de Socket.IO con autenticación JWT
   */
  connect(token: string): void {
    if (this.socket?.connected) {
      console.log('Socket ya está conectado');
      return;
    }

    // Desconectar socket previo si existe
    if (this.socket) {
      this.socket.disconnect();
    }

    // Crear nueva conexión con autenticación al namespace /delivery
    this.socket = io(`${environment.apiUrl}/delivery`, {
      auth: {
        token: `Bearer ${token}`,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // Manejar eventos de conexión
    this.socket.on('connect', () => {
      console.log('✅ Socket.IO conectado');
      this.connected$.next(true);
    });

    this.socket.on('disconnect', (reason: any) => {
      console.log('❌ Socket.IO desconectado:', reason);
      this.connected$.next(false);
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('❌ Error de conexión Socket.IO:', error);
      this.connected$.next(false);
    });

    // Manejar errores de autenticación (token expirado, inválido, etc.)
    this.socket.on('auth_error', async (error: AuthError) => {
      console.error('🔐 Error de autenticación:', error);

      if (error.code === 'TOKEN_EXPIRED') {
        console.log('⏰ Token expirado - Intentando refrescar...');

        try {
          // Intentar refrescar el token automáticamente usando el método refresh() que retorna Observable
          this.authService.refresh().subscribe({
            next: (newToken) => {
              console.log('✅ Token refrescado - Reconectando...');

              // Desconectar y reconectar con nuevo token
              this.disconnect();
              setTimeout(() => {
                this.connect(newToken);
              }, 500);
            },
            error: (err) => {
              console.error('❌ Error al refrescar token:', err);
              console.warn(
                '⚠️ No se pudo refrescar el token - Usuario debe reloguearse'
              );
              // El AuthService ya maneja el logout automático
            },
          });
        } catch (err) {
          console.error('❌ Error al refrescar token:', err);
        }
      } else if (error.code === 'INVALID_TOKEN') {
        console.error('❌ Token inválido - Usuario debe reloguearse');
        await this.authService.logout();
      }

      this.connected$.next(false);
    });

    // Escuchar evento de nuevo pedido disponible para repartidores
    this.socket.on('new-order-available', (data: NewOrderNotification) => {
      console.log('🔔 Nuevo pedido disponible:', data);
      this.newOrderSubject$.next(data);
    });

    // Escuchar actualización de estado de pedido
    this.socket.on('order-status-updated', (data: OrderStatusUpdate) => {
      console.log('📦 Estado de pedido actualizado:', data);
      this.orderStatusUpdatedSubject$.next(data);
    });

    // Escuchar ubicación de repartidor actualizada
    this.socket.on('delivery-location-updated', (data: any) => {
      console.log('📍 Ubicación de repartidor actualizada:', data);
    });
  }

  /**
   * Desconecta del servidor de Socket.IO
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = undefined;
      this.connected$.next(false);
      console.log('Socket.IO desconectado manualmente');
    }
  }

  /**
   * Emite un evento al servidor
   */
  emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('No se puede emitir evento, socket no conectado');
    }
  }

  /**
   * Escucha un evento específico del servidor
   */
  on(event: string, callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Deja de escuchar un evento específico
   */
  off(event: string): void {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  /**
   * Une al repartidor a una sala específica de pedido
   */
  joinOrderRoom(orderId: string): void {
    this.emit('joinOrderRoom', { orderId });
  }

  /**
   * Sale de una sala específica de pedido
   */
  leaveOrderRoom(orderId: string): void {
    this.emit('leaveOrderRoom', { orderId });
  }

  /**
   * Actualiza la ubicación del repartidor mediante WebSocket
   * (Solo para repartidores durante una entrega activa)
   */
  sendDriverLocationUpdate(data: {
    orderId?: string;
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    accuracy?: number;
  }): void {
    if (!this.socket?.connected) {
      console.warn('No se puede enviar ubicación, socket no conectado');
      return;
    }

    this.emit('driverLocationUpdate', data);
    console.log('📍 Ubicación del repartidor enviada:', data);
  }

  /**
   * Verifica si el socket está conectado
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}
