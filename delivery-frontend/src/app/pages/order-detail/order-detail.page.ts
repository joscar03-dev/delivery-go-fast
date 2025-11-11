import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonChip,
  IonSpinner,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonThumbnail,
  IonBadge,
} from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { SocketService } from '../../services/socket.service';
import { Order, OrderStatus } from '../../models/order.model';
import { Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  timeOutline,
  locationOutline,
  restaurantOutline,
  receiptOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  bicycleOutline,
  navigateOutline,
  speedometerOutline,
  refreshOutline,
} from 'ionicons/icons';

addIcons({
  'time-outline': timeOutline,
  'location-outline': locationOutline,
  'restaurant-outline': restaurantOutline,
  'receipt-outline': receiptOutline,
  'checkmark-circle-outline': checkmarkCircleOutline,
  'close-circle-outline': closeCircleOutline,
  'bicycle-outline': bicycleOutline,
  'navigate-outline': navigateOutline,
  'speedometer-outline': speedometerOutline,
  'refresh-outline': refreshOutline,
});

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.page.html',
  styleUrls: ['./order-detail.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonChip,
    IonSpinner,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonThumbnail,
    IonBadge,
    CommonModule,
    FormsModule,
  ],
})
export class OrderDetailPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);
  private socketService = inject(SocketService);

  order: Order | null = null;
  loading = false;

  // Tracking en tiempo real del repartidor
  driverLocation: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    estimatedArrival?: string;
    lastUpdate?: Date;
  } | null = null;
  isSocketConnected = false;

  private subscriptions: Subscription[] = [];

  ngOnInit() {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      this.loadOrderDetail(orderId);
    }
  }

  ngOnDestroy() {
    // Limpiar suscripciones
    this.subscriptions.forEach((sub) => sub.unsubscribe());

    // Salir de la sala del pedido
    if (this.order) {
      this.socketService.leaveOrderRoom(this.order.id);
    }
  }

  async loadOrderDetail(orderId: string): Promise<void> {
    this.loading = true;
    try {
      this.order =
        (await this.orderService.getOrderDetail(orderId).toPromise()) || null;

      // Si el pedido está en delivery, configurar WebSocket para tracking
      if (this.order && this.order.status === OrderStatus.OUT_FOR_DELIVERY) {
        this.setupDriverTracking(orderId);
      }
    } catch (error) {
      console.error('Error loading order detail:', error);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Configura el tracking del repartidor vía WebSocket
   */
  private setupDriverTracking(orderId: string) {
    // Conectar al WebSocket si no está conectado
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
        if (connected) {
          console.log('🔌 Socket conectado - Uniéndose a sala del pedido');
          this.socketService.joinOrderRoom(orderId);
        }
      }
    );
    this.subscriptions.push(connectionSub);

    // Escuchar cambios de estado del pedido en tiempo real
    const statusUpdateSub = this.socketService.orderStatusUpdated$.subscribe(
      (update) => {
        if (update && update.orderId === orderId) {
          console.log(
            '🔄 Estado del pedido actualizado, recargando...',
            update
          );
          this.loadOrderDetail(orderId);
        }
      }
    );
    this.subscriptions.push(statusUpdateSub);

    // Escuchar actualizaciones de ubicación del repartidor
    this.socketService.on('orderLocationUpdate', (data: any) => {
      console.log('📍 Actualización de ubicación recibida:', data);
      this.driverLocation = {
        latitude: data.latitude,
        longitude: data.longitude,
        heading: data.heading,
        speed: data.speed,
        estimatedArrival: data.estimatedArrival,
        lastUpdate: new Date(),
      };
    });

    // Escuchar confirmación de unirse a la sala
    this.socketService.on('joinedOrderRoom', (data: any) => {
      console.log('✅ Unido a sala del pedido:', data);
    });

    // Escuchar errores
    this.socketService.on('error', (error: any) => {
      console.error('❌ Error del socket:', error);
    });
  }

  /**
   * Abre Google Maps con la ubicación del repartidor
   */
  openDriverLocation() {
    if (this.driverLocation) {
      const url = `https://www.google.com/maps?q=${this.driverLocation.latitude},${this.driverLocation.longitude}`;
      window.open(url, '_blank');
    }
  }

  /**
   * Formatea el tiempo estimado de llegada
   */
  getEstimatedArrivalText(): string {
    if (!this.driverLocation?.estimatedArrival) {
      return 'Calculando...';
    }

    const arrivalTime = new Date(this.driverLocation.estimatedArrival);
    const now = new Date();
    const diffMs = arrivalTime.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);

    if (diffMins < 1) {
      return 'Llegando ahora';
    } else if (diffMins === 1) {
      return '1 minuto';
    } else {
      return `${diffMins} minutos`;
    }
  }

  /**
   * Formatea la velocidad del driver de forma segura
   */
  getDriverSpeed(): string {
    if (!this.driverLocation?.speed) {
      return '0.0';
    }
    const speed = Number(this.driverLocation.speed);
    return isNaN(speed) ? '0.0' : speed.toFixed(1);
  }

  getStatusColor(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.PENDING:
        return 'warning';
      case OrderStatus.CONFIRMED:
        return 'primary';
      case OrderStatus.PREPARING:
        return 'secondary';
      case OrderStatus.OUT_FOR_DELIVERY:
        return 'tertiary';
      case OrderStatus.DELIVERED:
        return 'success';
      case OrderStatus.CANCELLED:
        return 'danger';
      default:
        return 'medium';
    }
  }

  getStatusText(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.PENDING:
        return 'Pendiente';
      case OrderStatus.CONFIRMED:
        return 'Confirmado';
      case OrderStatus.PREPARING:
        return 'Preparando';
      case OrderStatus.OUT_FOR_DELIVERY:
        return 'En camino';
      case OrderStatus.DELIVERED:
        return 'Entregado';
      case OrderStatus.CANCELLED:
        return 'Cancelado';
      default:
        return status;
    }
  }

  getStatusIcon(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.DELIVERED:
        return 'checkmark-circle-outline';
      case OrderStatus.CANCELLED:
        return 'close-circle-outline';
      default:
        return 'time-outline';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Normaliza las opciones para mostrarlas como grupos con chips
  optionGroups(item: any): Array<{
    groupName: string;
    options: Array<{ name: string; extraPrice?: number }>;
  }> {
    const opts: any = item?.options;
    if (opts && typeof opts === 'object' && Array.isArray(opts.groups)) {
      return opts.groups.map((g: any) => ({
        groupName: g.groupName || g.name || 'Opciones',
        options: Array.isArray(g.options)
          ? g.options.map((o: any) => ({
              name: o?.name ?? String(o?.id ?? ''),
              extraPrice: Number(o?.extraPrice) || 0,
            }))
          : [],
      }));
    }
    if (Array.isArray(opts)) {
      return [
        {
          groupName: 'Opciones',
          options: opts.map((v: any) => ({ name: String(v), extraPrice: 0 })),
        },
      ];
    }
    return [];
  }

  // -- Helpers de precios por ítem --
  baseUnit(item: any): number {
    // Preferimos el precio base del menú; si no está, usamos el unitario del ítem
    const base = item?.menuItem?.price ?? item?.price ?? 0;
    return Number(base) || 0;
  }

  extrasUnit(item: any): number {
    const groups = this.optionGroups(item);
    const extras = groups.reduce((sum, g) => {
      const groupSum = (g.options || []).reduce(
        (acc, o) => acc + (Number(o?.extraPrice) || 0),
        0
      );
      return sum + groupSum;
    }, 0);
    return Number(extras) || 0;
  }

  unitTotal(item: any): number {
    return this.baseUnit(item) + this.extrasUnit(item);
  }

  lineTotal(item: any): number {
    const qty = Number(item?.quantity) || 0;
    return this.unitTotal(item) * qty;
  }
}
