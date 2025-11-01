import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, Platform } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import {
  ToastController,
  AlertController,
  LoadingController,
} from '@ionic/angular/standalone';
import {
  DeliveryService,
  DeliveryOrder,
  OrderStatus,
} from '../../../services/delivery.service';
import { SocketService } from '../../../services/socket.service';
import { Subscription, interval } from 'rxjs';
import { Geolocation } from '@capacitor/geolocation';

@Component({
  selector: 'app-delivery-detail',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './active-delivery.page.html',
  styleUrls: ['./active-delivery.page.scss'],
})
export class DeliveryDetailPage implements OnInit, OnDestroy {
  private deliveryService = inject(DeliveryService);
  private socketService = inject(SocketService);
  private toast = inject(ToastController);
  private alert = inject(AlertController);
  private loading = inject(LoadingController);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private platform = inject(Platform);

  // Exponer el enum para usarlo en el template
  readonly OrderStatus = OrderStatus;

  activeOrder: DeliveryOrder | null = null;
  currentStatus: OrderStatus = OrderStatus.CONFIRMED;
  isLoadingData = false;
  isSocketConnected = false;

  private subscriptions: Subscription[] = [];
  private locationUpdateInterval?: Subscription;

  // Estados del flujo de entrega
  statusFlow = [
    {
      status: OrderStatus.PENDING,
      label: 'Pendiente',
      icon: 'time-outline',
    },
    {
      status: OrderStatus.CONFIRMED,
      label: 'Confirmado',
      icon: 'checkmark-circle',
    },
    {
      status: OrderStatus.PREPARING,
      label: 'En preparación',
      icon: 'restaurant',
    },
    {
      status: OrderStatus.OUT_FOR_DELIVERY,
      label: 'En reparto',
      icon: 'bicycle',
    },
    {
      status: OrderStatus.DELIVERED,
      label: 'Entregado',
      icon: 'checkmark-done',
    },
    {
      status: OrderStatus.CANCELLED,
      label: 'Cancelado',
      icon: 'close-circle',
    },
  ];

  ngOnInit(): void {
    // Obtener el ID del pedido de los parámetros de ruta
    const orderId = this.route.snapshot.paramMap.get('id');

    if (orderId) {
      this.loadDeliveryById(orderId);
    } else {
      // Si no hay ID, redirigir a mis entregas
      this.router.navigate(['/delivery-driver/my-deliveries']);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.stopLocationTracking();

    // Salir de la sala del pedido si existe
    if (this.activeOrder) {
      this.socketService.leaveOrderRoom(this.activeOrder.id);
    }
  }

  /**
   * Configura la conexión de Socket.IO y se une a la sala del pedido
   */
  private setupSocketConnection(): void {
    if (!this.activeOrder) return;

    // Verificar si ya está conectado
    if (!this.socketService.isConnected()) {
      const token = localStorage.getItem('access_token');
      if (token) {
        this.socketService.connect(token);
      }
    }

    // Suscribirse al estado de conexión
    const connectionSub = this.socketService.isConnected$.subscribe(
      (connected) => {
        this.isSocketConnected = connected;
        if (connected && this.activeOrder) {
          console.log('🔌 Socket conectado - Uniéndose a sala del pedido');
          this.socketService.joinOrderRoom(this.activeOrder.id);
        }
      }
    );
    this.subscriptions.push(connectionSub);

    // Escuchar actualizaciones de estado del pedido
    const statusUpdateSub = this.socketService.orderStatusUpdated$.subscribe(
      (update) => {
        if (
          update &&
          this.activeOrder &&
          update.orderId === this.activeOrder.id
        ) {
          console.log(
            '🔄 Estado del pedido actualizado, recargando...',
            update
          );
          this.loadDeliveryById(this.activeOrder.id);
        }
      }
    );
    this.subscriptions.push(statusUpdateSub);

    // Escuchar confirmación de actualización de ubicación
    this.socketService.on('locationUpdated', (data) => {
      console.log('✅ Ubicación actualizada correctamente:', data);
    });

    // Escuchar errores
    this.socketService.on('error', async (error) => {
      console.error('❌ Error del socket:', error);
      const toast = await this.toast.create({
        message: error.message || 'Error en la comunicación en tiempo real',
        duration: 2000,
        color: 'warning',
      });
      await toast.present();
    });
  }

  /**
   * Carga un pedido específico por ID
   */
  loadDeliveryById(orderId: string) {
    this.isLoadingData = true;
    const sub = this.deliveryService.getDeliveryById(orderId).subscribe({
      next: (order: DeliveryOrder) => {
        this.activeOrder = order;
        this.currentStatus = order.status as OrderStatus;
        this.setupSocketConnection();
        this.startLocationTracking();
        this.isLoadingData = false;
      },
      error: async (err: any) => {
        this.isLoadingData = false;
        const toast = await this.toast.create({
          message: err?.error?.message || 'Error al cargar el pedido',
          duration: 2000,
          color: 'danger',
        });
        await toast.present();
        this.router.navigate(['/delivery-driver/my-deliveries']);
      },
    });
    this.subscriptions.push(sub);
  }

  /**
   * Actualiza el estado del pedido
   */
  async updateStatus(newStatus: OrderStatus) {
    if (!this.activeOrder) return;

    const confirmMessage = this.getConfirmMessage(newStatus);
    const confirmAlert = await this.alert.create({
      header: 'Confirmar acción',
      message: confirmMessage,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar',
          role: 'confirm',
          handler: () => this.performStatusUpdate(newStatus),
        },
      ],
    });

    await confirmAlert.present();
  }

  private async performStatusUpdate(newStatus: OrderStatus) {
    if (!this.activeOrder) return;

    const loadingEl = await this.loading.create({
      message: 'Actualizando estado...',
    });
    await loadingEl.present();

    const sub = this.deliveryService
      .updateOrderStatus(this.activeOrder.id, newStatus)
      .subscribe({
        next: async (updatedOrder) => {
          await loadingEl.dismiss();
          this.activeOrder = updatedOrder;
          this.currentStatus = newStatus;

          const toast = await this.toast.create({
            message: 'Estado actualizado exitosamente',
            duration: 1500,
            color: 'success',
          });
          await toast.present();

          // Si el pedido fue entregado, redirigir a mis entregas
          if (newStatus === OrderStatus.DELIVERED) {
            this.stopLocationTracking();
            setTimeout(() => {
              this.router.navigate(['/delivery-driver/my-deliveries']);
            }, 2000);
          }
        },
        error: async (err) => {
          await loadingEl.dismiss();
          const toast = await this.toast.create({
            message: err?.error?.message || 'Error al actualizar el estado',
            duration: 2500,
            color: 'danger',
          });
          await toast.present();
        },
      });
    this.subscriptions.push(sub);
  }

  /**
   * Inicia el seguimiento de ubicación
   */
  private async startLocationTracking() {
    if (!this.activeOrder) return;

    try {
      // Verificar si estamos en web (navegador)
      const isWeb =
        this.platform.is('desktop') || this.platform.is('mobileweb');

      if (isWeb) {
        console.log('📍 Modo WEB detectado - Usando coordenadas simuladas');

        // Mostrar aviso al usuario
        const toast = await this.toast.create({
          message:
            '⚠️ Modo de prueba: usando ubicación simulada (Arequipa, Perú)',
          duration: 4000,
          color: 'warning',
        });
        await toast.present();

        // Actualizar con ubicación simulada cada 30 segundos
        this.locationUpdateInterval = interval(30000).subscribe(() => {
          this.sendSimulatedLocation();
        });

        // Enviar ubicación inicial inmediatamente
        this.sendSimulatedLocation();

        console.log('📍 Seguimiento de ubicación simulada iniciado');
        return;
      }

      // Código original para dispositivos móviles
      const permission = await Geolocation.requestPermissions();
      if (permission.location !== 'granted') {
        const toast = await this.toast.create({
          message: 'Se requieren permisos de ubicación para el seguimiento',
          duration: 3000,
          color: 'warning',
        });
        await toast.present();
        return;
      }

      // Actualizar ubicación cada 30 segundos
      this.locationUpdateInterval = interval(30000).subscribe(async () => {
        await this.getCurrentPositionAndUpdate();
      });

      // Enviar ubicación inicial inmediatamente
      await this.getCurrentPositionAndUpdate();

      console.log('📍 Seguimiento de ubicación iniciado');
    } catch (error) {
      console.error('Error al iniciar seguimiento de ubicación:', error);

      // En caso de error, intentar con ubicación simulada
      console.log('📍 Usando ubicación simulada como respaldo');
      this.locationUpdateInterval = interval(30000).subscribe(() => {
        this.sendSimulatedLocation();
      });
      this.sendSimulatedLocation();
    }
  }

  /**
   * Envía una ubicación simulada para pruebas en navegador web
   * Coordenadas de Arequipa, Perú con pequeñas variaciones aleatorias
   */
  private sendSimulatedLocation() {
    // Ubicación base: Centro de Arequipa, Perú
    const baseLat = -16.409047;
    const baseLng = -71.537451;

    // Agregar pequeñas variaciones aleatorias para simular movimiento
    const latVariation = (Math.random() - 0.5) * 0.001; // ~100 metros
    const lngVariation = (Math.random() - 0.5) * 0.001;

    const simulatedLat = baseLat + latVariation;
    const simulatedLng = baseLng + lngVariation;

    console.log(
      `📍 Enviando ubicación simulada: ${simulatedLat}, ${simulatedLng}`
    );

    this.updateLocation(
      simulatedLat,
      simulatedLng,
      Math.random() * 360, // Heading aleatorio
      10 + Math.random() * 20, // Velocidad entre 10-30 km/h
      10 // Precisión de 10 metros
    );
  }

  /**
   * Obtiene la posición actual y la envía
   */
  private async getCurrentPositionAndUpdate() {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });

      this.updateLocation(
        position.coords.latitude,
        position.coords.longitude,
        position.coords.heading || undefined,
        position.coords.speed || undefined,
        position.coords.accuracy
      );
    } catch (error) {
      console.error('Error al obtener ubicación:', error);
    }
  }

  /**
   * Detiene el seguimiento de ubicación
   */
  private stopLocationTracking() {
    if (this.locationUpdateInterval) {
      this.locationUpdateInterval.unsubscribe();
      this.locationUpdateInterval = undefined;
      console.log('📍 Seguimiento de ubicación detenido');
    }
  }

  /**
   * Envía la ubicación actual al servidor mediante WebSocket
   */
  private updateLocation(
    latitude: number,
    longitude: number,
    heading?: number,
    speed?: number,
    accuracy?: number
  ) {
    if (!this.activeOrder) return;

    // Enviar ubicación mediante WebSocket
    this.socketService.sendDriverLocationUpdate({
      orderId: this.activeOrder.id,
      latitude,
      longitude,
      heading,
      speed,
      accuracy,
    });

    console.log(`📍 Ubicación enviada: ${latitude}, ${longitude}`);
  }

  /**
   * Abre el mapa para navegar a una dirección
   */
  async openMap(latitude: number, longitude: number) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    window.open(url, '_system');
  }

  /**
   * Navegar al restaurante
   */
  navigateToRestaurant() {
    if (this.activeOrder?.restaurant?.location?.coordinates) {
      const [lon, lat] = this.activeOrder.restaurant.location.coordinates;
      this.openMap(lat, lon);
    }
  }

  /**
   * Navegar a la dirección de entrega
   * TODO: El backend necesita agregar deliveryLocation para navegar
   */
  navigateToDeliveryAddress() {
    // Temporalmente deshabilitado hasta que backend tenga deliveryLocation
    /* if (this.activeOrder?.deliveryLocation?.coordinates) {
      const [lon, lat] = this.activeOrder.deliveryLocation.coordinates;
      this.openMap(lat, lon);
    } */
  }

  /**
   * Obtiene el mensaje de confirmación para cada estado
   */
  private getConfirmMessage(status: OrderStatus): string {
    const messages: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: '¿Marcar como pendiente?',
      [OrderStatus.CONFIRMED]: '¿Confirmar el pedido?',
      [OrderStatus.PREPARING]: '¿Marcar como en preparación?',
      [OrderStatus.READY_FOR_PICKUP]: '¿Marcar como listo para recoger?',
      [OrderStatus.OUT_FOR_DELIVERY]: '¿Marcar como en reparto?',
      [OrderStatus.DELIVERED]: '¿Confirmar que el pedido fue entregado?',
      [OrderStatus.CANCELLED]: '¿Cancelar el pedido?',
    };
    return messages[status] || '¿Actualizar el estado del pedido?';
  }

  /**
   * Determina si un botón de estado debe estar habilitado
   */
  isStatusButtonEnabled(targetStatus: OrderStatus): boolean {
    const flowIndex = this.statusFlow.findIndex(
      (s) => s.status === this.currentStatus
    );
    const targetIndex = this.statusFlow.findIndex(
      (s) => s.status === targetStatus
    );

    // Solo permitir avanzar al siguiente estado en el flujo
    return targetIndex === flowIndex + 1;
  }

  /**
   * Obtiene el índice del estado actual en el flujo
   */
  getCurrentStatusIndex(): number {
    return this.statusFlow.findIndex((s) => s.status === this.currentStatus);
  }
}
