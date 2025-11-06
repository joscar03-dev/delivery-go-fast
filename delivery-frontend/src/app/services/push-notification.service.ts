import { Injectable } from '@angular/core';
import {
  PushNotifications,
  Token,
  PushNotificationSchema,
  ActionPerformed,
} from '@capacitor/push-notifications';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular/standalone';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

/**
 * Servicio para manejar notificaciones push usando Capacitor
 * Sistema híbrido con Socket.IO para actualizaciones en tiempo real
 */
@Injectable({
  providedIn: 'root',
})
export class PushNotificationService {
  private currentToken: string | null = null;

  constructor(
    private router: Router,
    private platform: Platform,
    private http: HttpClient
  ) {}

  /**
   * Inicializa las notificaciones push
   * Se debe llamar después del login
   */
  async initializePushNotifications(): Promise<void> {
    // Solo funciona en dispositivos nativos (iOS/Android)
    if (!this.platform.is('capacitor')) {
      console.log(
        '📱 Push Notifications: Solo disponible en apps nativas (iOS/Android)'
      );
      return;
    }

    console.log('📱 Inicializando Push Notifications...');

    try {
      await this.registerListeners();
      await this.registerDevice();
    } catch (error) {
      console.error('Error inicializando push notifications:', error);
    }
  }

  /**
   * Registra los listeners de eventos de notificaciones
   */
  private async registerListeners(): Promise<void> {
    // Cuando el dispositivo se registra exitosamente
    await PushNotifications.addListener('registration', (token: Token) => {
      console.log('📱 Push token recibido:', token.value);
      this.currentToken = token.value;
      this.sendTokenToBackend(token.value);
    });

    // Cuando hay un error al registrar
    await PushNotifications.addListener('registrationError', (error: any) => {
      console.error('📱 Error en registro de push:', error);
    });

    // Cuando llega una notificación con la app en primer plano
    await PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('📬 Notificación recibida (app abierta):', notification);

        // Aquí podrías mostrar un toast o actualizar la UI
        // El Socket.IO ya manejará la actualización en tiempo real
        console.log('💡 La actualización en tiempo real la maneja Socket.IO');
      }
    );

    // Cuando el usuario toca/abre una notificación
    await PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action: ActionPerformed) => {
        console.log('🔔 Notificación tocada:', action);

        const data = action.notification.data;

        // Navegar a la pantalla correspondiente según los datos
        if (data.screen && data.orderId) {
          this.navigateToScreen(data.screen, data.orderId);
        } else if (data.orderId) {
          // Por defecto ir al detalle del pedido
          this.router.navigate(['/order-detail', data.orderId]);
        }
      }
    );

    console.log('✅ Listeners de push notifications registrados');
  }

  /**
   * Registra el dispositivo para recibir notificaciones
   */
  private async registerDevice(): Promise<void> {
    try {
      // Verificar permisos
      let permStatus = await PushNotifications.checkPermissions();

      // Si no ha respondido, solicitar permisos
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      // Si el usuario denegó los permisos
      if (permStatus.receive !== 'granted') {
        console.warn('⚠️ Permisos de notificaciones denegados');
        return;
      }

      // Registrar el dispositivo con FCM/APNs
      await PushNotifications.register();
      console.log('✅ Dispositivo registrado para push notifications');
    } catch (error) {
      console.error('Error al registrar dispositivo:', error);
    }
  }

  /**
   * Envía el token FCM al backend para almacenarlo
   */
  private async sendTokenToBackend(token: string): Promise<void> {
    try {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        console.warn(
          '⚠️ No hay token de acceso, no se puede registrar el dispositivo'
        );
        return;
      }

      const headers = new HttpHeaders({
        Authorization: `Bearer ${accessToken}`,
      });

      // Detectar plataforma
      let platform: 'ios' | 'android' | 'web' = 'web';
      if (this.platform.is('ios')) {
        platform = 'ios';
      } else if (this.platform.is('android')) {
        platform = 'android';
      }

      const deviceInfo = {
        model: await this.getDeviceModel(),
        platform: this.platform.platforms().join(', '),
      };

      const response = await firstValueFrom(
        this.http.post(
          `${environment.apiUrl}/notifications/register-token`,
          {
            token,
            platform,
            deviceInfo,
          },
          { headers }
        )
      );

      console.log('✅ Token enviado al backend:', response);
    } catch (error) {
      console.error('Error enviando token al backend:', error);
    }
  }

  /**
   * Navega a la pantalla correcta según el tipo de notificación
   */
  private navigateToScreen(screen: string, orderId?: string): void {
    console.log(`🧭 Navegando a ${screen}`, orderId);

    switch (screen) {
      case 'order-detail':
        if (orderId) {
          this.router.navigate(['/order-detail', orderId]);
        }
        break;

      case 'restaurant-orders':
        this.router.navigate(['/restaurant-orders']);
        break;

      case 'available-deliveries':
        this.router.navigate(['/tabs/tab3']);
        break;

      case 'my-deliveries':
        this.router.navigate(['/my-deliveries']);
        break;

      case 'order-history':
        this.router.navigate(['/tabs/order-history']);
        break;

      default:
        console.warn('Pantalla desconocida:', screen);
    }
  }

  /**
   * Desregistra el dispositivo (al hacer logout)
   */
  async unregisterDevice(): Promise<void> {
    if (!this.platform.is('capacitor') || !this.currentToken) {
      return;
    }

    try {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) return;

      const headers = new HttpHeaders({
        Authorization: `Bearer ${accessToken}`,
      });

      await firstValueFrom(
        this.http.request(
          'DELETE',
          `${environment.apiUrl}/notifications/unregister-token`,
          {
            headers,
            body: { token: this.currentToken },
          }
        )
      );

      console.log('✅ Dispositivo desregistrado');
      this.currentToken = null;

      // Remover todos los listeners
      await PushNotifications.removeAllListeners();
    } catch (error) {
      console.error('Error al desregistrar dispositivo:', error);
    }
  }

  /**
   * Obtiene el modelo del dispositivo (si está disponible)
   */
  private async getDeviceModel(): Promise<string> {
    try {
      // En producción, podrías usar @capacitor/device
      return 'Unknown';
    } catch {
      return 'Unknown';
    }
  }

  /**
   * Obtiene el número de notificaciones no leídas (badge)
   */
  async getBadgeCount(): Promise<number> {
    if (!this.platform.is('capacitor')) return 0;

    try {
      const result = await PushNotifications.getDeliveredNotifications();
      return result.notifications.length;
    } catch {
      return 0;
    }
  }

  /**
   * Limpia el badge de notificaciones
   */
  async clearBadge(): Promise<void> {
    if (!this.platform.is('capacitor')) return;

    try {
      await PushNotifications.removeAllDeliveredNotifications();
      console.log('✅ Badge limpiado');
    } catch (error) {
      console.error('Error limpiando badge:', error);
    }
  }
}
