import { Injectable } from '@angular/core';
import {
  PushNotifications,
  Token,
  PushNotificationSchema,
  ActionPerformed,
  Channel,
} from '@capacitor/push-notifications';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular/standalone';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { Capacitor } from '@capacitor/core';

/**
 * Servicio para manejar notificaciones push usando Capacitor
 * Sistema híbrido con Socket.IO para actualizaciones en tiempo real
 */
@Injectable({
  providedIn: 'root',
})
export class PushNotificationService {
  private currentToken: string | null = null;
  private listenersInitialized: boolean = false;

  constructor(
    private router: Router,
    private platform: Platform,
    private http: HttpClient
  ) {}

  /**
   * Inicializa SOLO los listeners de notificaciones
   * DEBE llamarse al inicio de la app (app.component.ts)
   * Esto permite responder a notificaciones que abren la app desde estado cerrado
   */
  async initializeListeners(): Promise<void> {
    try {
      // Solo funciona en dispositivos nativos (iOS/Android)
      if (!this.platform.is('capacitor')) {
        console.log(
          '📱 Push Notifications: Solo disponible en apps nativas (iOS/Android)'
        );
        return;
      }

      // Evitar inicializar múltiples veces
      if (this.listenersInitialized) {
        console.log('📱 Listeners ya inicializados, omitiendo...');
        return;
      }

      console.log('📱 Inicializando listeners de notificaciones...');

      // 🔔 CRÍTICO: Crear canal de notificaciones de alta prioridad en Android
      await this.createNotificationChannels();

      // Registrar los listeners de eventos
      await this.registerListeners();

      this.listenersInitialized = true;
      console.log('✅ Listeners de notificaciones inicializados');
    } catch (error) {
      console.error('❌ Error inicializando listeners:', error);
      // ✅ No propagar el error, las notificaciones son opcionales
    }
  }

  /**
   * Registra el dispositivo para recibir notificaciones
   * Se debe llamar DESPUÉS del login (cuando ya hay usuario autenticado)
   */
  async initializePushNotifications(): Promise<void> {
    try {
      // Solo funciona en dispositivos nativos (iOS/Android)
      if (!this.platform.is('capacitor')) {
        console.log(
          '📱 Push Notifications: Solo disponible en apps nativas (iOS/Android)'
        );
        return;
      }

      console.log('📱 Registrando dispositivo para push notifications...');

      // Asegurarse de que los listeners estén inicializados
      if (!this.listenersInitialized) {
        await this.initializeListeners();
      }

      // Registrar el dispositivo con FCM/APNs
      await this.registerDevice();
    } catch (error) {
      console.error('❌ Error registrando dispositivo:', error);
      // ✅ No propagar el error, las notificaciones son opcionales
      return;
    }
  }

  /**
   * Crea los canales de notificación requeridos por Android 8.0+
   * Sin esto, las notificaciones no sonarán ni vibrarán cuando la app esté cerrada
   */
  private async createNotificationChannels(): Promise<void> {
    try {
      // Solo en Android
      if (Capacitor.getPlatform() !== 'android') {
        console.log('📱 Canales de notificación: Solo requeridos en Android');
        return;
      }

      console.log('🔔 Creando canales de notificación de alta prioridad...');

      // Canal para nuevos pedidos (PRIORIDAD MÁXIMA)
      const pedidosChannel: Channel = {
        id: 'pedidos_criticos',
        name: 'Nuevos Pedidos',
        description: 'Notificaciones de alta prioridad para nuevos pedidos',
        importance: 5, // Nivel 5 = URGENTE (sonido + vibración + popup)
        sound: 'default',
        vibration: true,
        visibility: 1, // VISIBILITY_PUBLIC (visible en pantalla de bloqueo)
        lights: true,
        lightColor: '#FF0000', // Rojo
      };

      await PushNotifications.createChannel(pedidosChannel);
      console.log('✅ Canal "pedidos_criticos" creado');

      // Canal para cambios de estado (PRIORIDAD ALTA)
      const estadoChannel: Channel = {
        id: 'estado_pedidos',
        name: 'Estado de Pedidos',
        description: 'Notificaciones sobre cambios en el estado de tus pedidos',
        importance: 4, // Nivel 4 = ALTA (sonido + vibración)
        sound: 'default',
        vibration: true,
        visibility: 1,
        lights: true,
        lightColor: '#0000FF', // Azul
      };

      await PushNotifications.createChannel(estadoChannel);
      console.log('✅ Canal "estado_pedidos" creado');

      // Canal para repartidores (PRIORIDAD MÁXIMA)
      const repartidoresChannel: Channel = {
        id: 'delivery_driver',
        name: 'Asignación de Entregas',
        description: 'Notificaciones de alta prioridad para repartidores',
        importance: 5,
        sound: 'default',
        vibration: true,
        visibility: 1,
        lights: true,
        lightColor: '#00FF00', // Verde
      };

      await PushNotifications.createChannel(repartidoresChannel);
      console.log('✅ Canal "delivery_driver" creado');

      console.log('✅ Todos los canales de notificación creados exitosamente');
    } catch (error) {
      console.error('❌ Error creando canales de notificación:', error);
      // No propagar el error, continuar con el registro
    }
  }

  /**
   * Registra los listeners de eventos de notificaciones
   */
  private async registerListeners(): Promise<void> {
    try {
      // Cuando el dispositivo se registra exitosamente
      await PushNotifications.addListener('registration', (token: Token) => {
        console.log('📱 Push token recibido:', token.value);
        this.currentToken = token.value;
        this.sendTokenToBackend(token.value).catch((err) => {
          console.error('Error enviando token al backend:', err);
        });
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
    } catch (error) {
      console.error('❌ Error registrando listeners:', error);
      throw error; // Propagar para que initializePushNotifications lo maneje
    }
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
      console.error('❌ Error al registrar dispositivo:', error);
      throw error; // Propagar para que initializePushNotifications lo maneje
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
