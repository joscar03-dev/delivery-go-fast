import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import {
  ToastController,
  RefresherCustomEvent,
} from '@ionic/angular/standalone';
import {
  DeliveryService,
  DeliveryOrder,
} from '../../../services/delivery.service';
import { SocketService } from '../../../services/socket.service';
import { Subscription, interval } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  wifiOutline,
  wifi,
  refreshOutline,
  bicycleOutline,
  restaurantOutline,
  locationOutline,
  navigateOutline,
  timeOutline,
  bagOutline,
  checkmarkCircleOutline,
  cashOutline,
} from 'ionicons/icons';

// Registrar íconos
addIcons({
  'wifi-outline': wifiOutline,
  wifi: wifi,
  'refresh-outline': refreshOutline,
  'bicycle-outline': bicycleOutline,
  'restaurant-outline': restaurantOutline,
  'location-outline': locationOutline,
  'navigate-outline': navigateOutline,
  'time-outline': timeOutline,
  'bag-outline': bagOutline,
  'checkmark-circle-outline': checkmarkCircleOutline,
  'cash-outline': cashOutline,
});

@Component({
  selector: 'app-available-deliveries',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './available-deliveries.page.html',
  styleUrls: ['./available-deliveries.page.scss'],
})
export class AvailableDeliveriesPage implements OnInit, OnDestroy {
  private deliveryService = inject(DeliveryService);
  private socketService = inject(SocketService);
  private toast = inject(ToastController);
  private router = inject(Router);

  availableOrders: DeliveryOrder[] = [];
  pendingOrders: DeliveryOrder[] = [];
  selectedSegment: 'disponibles' | 'proximos' = 'disponibles';
  loading = false;
  isSocketConnected = false;
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.loadAvailableDeliveries();
    this.loadPendingDeliveries();
    this.setupSocketConnection();
    this.listenToNewOrders();
    this.setupAutoRefresh();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  /**
   * Configura la conexión de Socket.IO
   */
  private setupSocketConnection(): void {
    // Obtener el token del localStorage (asumiendo que se guarda ahí después del login)
    const token = localStorage.getItem('access_token');
    if (token) {
      this.socketService.connect(token);

      // Suscribirse al estado de conexión
      const connectionSub = this.socketService.isConnected$.subscribe(
        (connected) => {
          this.isSocketConnected = connected;
          if (connected) {
            console.log('🔌 Socket conectado - Escuchando nuevos pedidos');
          }
        }
      );
      this.subscriptions.push(connectionSub);

      // Escuchar cambios de estado de pedidos en tiempo real
      const statusUpdateSub = this.socketService.orderStatusUpdated$.subscribe(
        (update) => {
          if (update) {
            console.log(
              '🔄 Estado de pedido actualizado, recargando listas...',
              update
            );
            // Recargar ambas listas cuando cambie cualquier estado (modo silent)
            this.loadAvailableDeliveries(true);
            this.loadPendingDeliveries(true);
          }
        }
      );
      this.subscriptions.push(statusUpdateSub);
    }
  }

  /**
   * Configura actualización automática cada 30 segundos (backup del Socket.IO)
   */
  private setupAutoRefresh(): void {
    const refreshSub = interval(30000).subscribe(() => {
      console.log('🔄 Auto-refresh: recargando listas de pedidos...');
      this.loadAvailableDeliveries(true);
      this.loadPendingDeliveries(true);
    });
    this.subscriptions.push(refreshSub);
  }

  /**
   * Escucha notificaciones de nuevos pedidos
   */
  private listenToNewOrders(): void {
    const newOrderSub = this.socketService.newOrder$.subscribe(
      async (notification) => {
        if (notification) {
          // Mostrar notificación
          const toast = await this.toast.create({
            message: `🔔 Nuevo pedido disponible: ${notification.restaurantName}`,
            duration: 3000,
            color: 'primary',
            position: 'top',
            buttons: [
              {
                text: 'Ver',
                handler: () => {
                  this.selectedSegment = 'disponibles';
                  this.loadAvailableDeliveries();
                },
              },
            ],
          });
          await toast.present();

          // Recargar automáticamente las listas (modo silent)
          this.loadAvailableDeliveries(true);
          this.loadPendingDeliveries(true);
        }
      }
    );
    this.subscriptions.push(newOrderSub);
  }

  /**
   * Carga los pedidos disponibles
   */
  loadAvailableDeliveries(silent = false) {
    if (!silent) {
      this.loading = true;
    }
    const sub = this.deliveryService.getAvailableDeliveries().subscribe({
      next: (orders) => {
        console.log('Pedidos disponibles recibidos:', orders);
        this.availableOrders = orders || [];
        if (!silent) {
          this.loading = false;
        }
      },
      error: async (err) => {
        if (!silent) {
          this.loading = false;
        }
        const toast = await this.toast.create({
          message: err?.error?.message || 'Error al cargar pedidos disponibles',
          duration: 2000,
          color: 'danger',
        });
        await toast.present();
      },
    });
    this.subscriptions.push(sub);
  }

  /**
   * Carga los pedidos PENDING para que el driver pueda planificar
   */
  loadPendingDeliveries(silent = false) {
    const sub = this.deliveryService.getPendingDeliveries().subscribe({
      next: (orders) => {
        console.log('Pedidos próximos (PENDING):', orders);
        this.pendingOrders = orders || [];
      },
      error: async (err) => {
        if (!silent) {
          const toast = await this.toast.create({
            message: err?.error?.message || 'Error al cargar pedidos próximos',
            duration: 2000,
            color: 'danger',
          });
          await toast.present();
        }
      },
    });
    this.subscriptions.push(sub);
  }

  /**
   * Refresca la lista de pedidos (pull-to-refresh)
   */
  handleRefresh(event: RefresherCustomEvent) {
    this.deliveryService.getAvailableDeliveries().subscribe({
      next: (orders) => {
        this.availableOrders = orders || [];
      },
      error: async (err) => {
        const toast = await this.toast.create({
          message:
            err?.error?.message || 'Error al refrescar pedidos disponibles',
          duration: 2000,
          color: 'danger',
        });
        await toast.present();
      },
    });

    this.deliveryService.getPendingDeliveries().subscribe({
      next: (orders) => {
        this.pendingOrders = orders || [];
        event.target.complete();
      },
      error: async (err) => {
        event.target.complete();
        const toast = await this.toast.create({
          message: err?.error?.message || 'Error al refrescar pedidos próximos',
          duration: 2000,
          color: 'danger',
        });
        await toast.present();
      },
    });
  }

  /**
   * Maneja el cambio de segmento entre Próximos y Disponibles
   */
  onSegmentChange(event: any) {
    this.selectedSegment = event.detail.value;
  }

  /**
   * Acepta un pedido para entregarlo
   */
  async acceptDelivery(order: DeliveryOrder) {
    const sub = this.deliveryService.acceptDelivery(order.id).subscribe({
      next: async (response) => {
        // Remover el pedido de la lista inmediatamente
        this.availableOrders = this.availableOrders.filter(
          (o) => o.id !== order.id
        );

        const toast = await this.toast.create({
          message: response.message || 'Pedido aceptado exitosamente',
          duration: 1500,
          color: 'success',
        });
        await toast.present();

        // Navegar a la página de mis entregas
        this.router.navigate(['/delivery-driver/my-deliveries']);
      },
      error: async (err) => {
        const toast = await this.toast.create({
          message:
            err?.error?.message ||
            'Error al aceptar el pedido. Puede que ya haya sido tomado.',
          duration: 2500,
          color: 'danger',
        });
        await toast.present();

        // Recargar la lista por si el pedido ya fue tomado
        this.loadAvailableDeliveries();
      },
    });
    this.subscriptions.push(sub);
  }

  /**
   * Calcula la distancia aproximada entre dos puntos (en km)
   * TODO: El backend necesita agregar deliveryLocation para calcular distancias
   */
  calculateDistance(order: DeliveryOrder): string {
    return 'N/A'; // Temporalmente deshabilitado hasta que backend tenga deliveryLocation

    // Esta es una implementación simple. En producción, podrías usar
    // la API de Google Maps Distance Matrix o similar
    /* if (
      !order.restaurant?.location?.coordinates ||
      !order.deliveryLocation?.coordinates
    ) {
      return 'N/A';
    }

    const [lon1, lat1] = order.restaurant.location.coordinates;
    const [lon2, lat2] = order.deliveryLocation.coordinates;

    const R = 6371; // Radio de la Tierra en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return `${distance.toFixed(2)} km`; */
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Formatea la fecha de creación del pedido
   */
  getOrderTime(createdAt: string): string {
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins === 1) return 'Hace 1 minuto';
    if (diffMins < 60) return `Hace ${diffMins} minutos`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return 'Hace 1 hora';
    if (diffHours < 24) return `Hace ${diffHours} horas`;

    return date.toLocaleDateString();
  }

  /**
   * Obtiene el label del estado del pedido
   */
  getStatusLabel(status: string): string {
    switch (status) {
      case 'confirmed':
        return 'Confirmado - Cocinando';
      case 'preparing':
        return 'En Preparación';
      case 'ready_for_pickup':
        return '¡Listo para recoger!';
      default:
        return status;
    }
  }

  /**
   * Obtiene el color del chip según el estado
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'confirmed':
        return 'warning';
      case 'preparing':
        return 'secondary';
      case 'ready_for_pickup':
        return 'success';
      default:
        return 'medium';
    }
  }

  /**
   * Calcula el tiempo estimado restante
   */
  getEstimatedTime(order: DeliveryOrder): string {
    // Verificar si el pedido tiene tiempo estimado
    const estimatedReadyTime = (order as any).estimatedReadyTime;
    if (!estimatedReadyTime) return 'Sin estimación';

    const now = new Date();
    const readyTime = new Date(estimatedReadyTime);
    const diff = readyTime.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes <= 0) return '¡Ya está listo!';
    if (minutes < 60) return `Listo en ~${minutes} min`;

    const hours = Math.floor(minutes / 60);
    const remainingMin = minutes % 60;
    return `Listo en ~${hours}h ${remainingMin}min`;
  }
}
