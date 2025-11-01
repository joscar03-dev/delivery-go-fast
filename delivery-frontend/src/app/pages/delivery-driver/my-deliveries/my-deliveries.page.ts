import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import {
  ToastController,
  RefresherCustomEvent,
} from '@ionic/angular/standalone';
import {
  DeliveryService,
  DeliveryOrder,
  OrderStatus,
} from '../../../services/delivery.service';
import { SocketService } from '../../../services/socket.service';
import { Subscription, interval } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  restaurantOutline,
  locationOutline,
  timeOutline,
  bagOutline,
  cashOutline,
  refreshOutline,
  arrowForwardOutline,
  bicycleOutline,
  checkmarkCircleOutline,
  wifiOutline,
  wifi,
} from 'ionicons/icons';

addIcons({
  'restaurant-outline': restaurantOutline,
  'location-outline': locationOutline,
  'time-outline': timeOutline,
  'bag-outline': bagOutline,
  'cash-outline': cashOutline,
  'refresh-outline': refreshOutline,
  'arrow-forward-outline': arrowForwardOutline,
  'bicycle-outline': bicycleOutline,
  'checkmark-circle-outline': checkmarkCircleOutline,
  'wifi-outline': wifiOutline,
  wifi: wifi,
});

@Component({
  selector: 'app-my-deliveries',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './my-deliveries.page.html',
  styleUrls: ['./my-deliveries.page.scss'],
})
export class MyDeliveriesPage implements OnInit, OnDestroy {
  private deliveryService = inject(DeliveryService);
  private socketService = inject(SocketService);
  private toast = inject(ToastController);
  private router = inject(Router);

  readonly OrderStatus = OrderStatus;

  myDeliveries: DeliveryOrder[] = [];
  loading = false;
  isSocketConnected = false;
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.loadMyDeliveries();
    this.setupSocketConnection();
    this.setupAutoRefresh();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  /**
   * Configura la conexión de Socket.IO
   */
  private setupSocketConnection(): void {
    const token = localStorage.getItem('access_token');
    if (token) {
      this.socketService.connect(token);

      const connectionSub = this.socketService.isConnected$.subscribe(
        (connected) => {
          this.isSocketConnected = connected;
        }
      );
      this.subscriptions.push(connectionSub);

      // Escuchar cambios de estado de pedidos
      const statusUpdateSub = this.socketService.orderStatusUpdated$.subscribe(
        (update) => {
          if (update) {
            console.log('🔄 Estado actualizado, recargando lista...', update);
            this.loadMyDeliveries(true);
          }
        }
      );
      this.subscriptions.push(statusUpdateSub);

      // Escuchar nuevos pedidos disponibles
      const newOrderSub = this.socketService.newOrder$.subscribe((order) => {
        if (order) {
          console.log('🆕 Nuevo pedido disponible, recargando lista...', order);
          this.loadMyDeliveries(true);
        }
      });
      this.subscriptions.push(newOrderSub);
    }
  }

  /**
   * Configura actualización automática cada 30 segundos
   */
  private setupAutoRefresh(): void {
    const refreshSub = interval(30000).subscribe(() => {
      this.loadMyDeliveries(true);
    });
    this.subscriptions.push(refreshSub);
  }

  /**
   * Carga todos los pedidos activos del driver
   */
  loadMyDeliveries(silent = false) {
    if (!silent) {
      this.loading = true;
    }

    const sub = this.deliveryService.getMyActiveDeliveries().subscribe({
      next: (orders) => {
        console.log('Mis entregas activas:', orders);
        this.myDeliveries = orders || [];
        this.loading = false;
      },
      error: async (err) => {
        this.loading = false;
        const toast = await this.toast.create({
          message: err?.error?.message || 'Error al cargar tus entregas',
          duration: 2000,
          color: 'danger',
        });
        await toast.present();
      },
    });
    this.subscriptions.push(sub);
  }

  /**
   * Refresca la lista de pedidos (pull-to-refresh)
   */
  handleRefresh(event: RefresherCustomEvent) {
    this.deliveryService.getMyActiveDeliveries().subscribe({
      next: (orders) => {
        this.myDeliveries = orders || [];
        event.target.complete();
      },
      error: async (err) => {
        event.target.complete();
        const toast = await this.toast.create({
          message: err?.error?.message || 'Error al refrescar',
          duration: 2000,
          color: 'danger',
        });
        await toast.present();
      },
    });
  }

  /**
   * Navega al detalle de un pedido específico
   */
  viewDeliveryDetail(order: DeliveryOrder) {
    this.router.navigate(['/delivery-driver/delivery-detail', order.id]);
  }

  /**
   * Obtiene el label del estado del pedido
   */
  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      preparing: 'En preparación',
      ready_for_pickup: 'Listo para recoger',
      out_for_delivery: 'En camino',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  }

  /**
   * Obtiene el color del badge según el estado
   */
  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      pending: 'warning',
      confirmed: 'primary',
      preparing: 'warning',
      ready_for_pickup: 'success',
      out_for_delivery: 'tertiary',
      delivered: 'success',
      cancelled: 'danger',
    };
    return colors[status] || 'medium';
  }

  /**
   * Obtiene el tiempo estimado o mensaje relevante
   */
  getTimeInfo(order: DeliveryOrder): string {
    if (order.status === OrderStatus.PREPARING && order.estimatedReadyTime) {
      const readyTime = new Date(order.estimatedReadyTime);
      const now = new Date();
      const diffMs = readyTime.getTime() - now.getTime();
      const diffMin = Math.ceil(diffMs / 60000);

      if (diffMin > 0) {
        return `Listo en ~${diffMin} min`;
      } else {
        return 'Debería estar listo';
      }
    }

    if (order.status === OrderStatus.READY_FOR_PICKUP) {
      return 'Listo para recoger';
    }

    if (order.status === OrderStatus.OUT_FOR_DELIVERY) {
      return 'Entregando...';
    }

    return 'Ver detalles';
  }

  /**
   * Formatea la fecha de creación
   */
  getOrderTime(createdAt: string): string {
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'Hace un momento';
    if (diffMin < 60) return `Hace ${diffMin} min`;

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;

    return date.toLocaleDateString();
  }
}
