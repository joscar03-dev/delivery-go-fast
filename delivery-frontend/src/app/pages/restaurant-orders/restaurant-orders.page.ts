import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonBadge,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonChip,
  ToastController,
  AlertController,
} from '@ionic/angular/standalone';
import { OrderService } from '../../services/order.service';
import { SocketService } from '../../services/socket.service';
import { Order, OrderStatus } from '../../models/order.model';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline,
  restaurantOutline,
  timeOutline,
  closeCircleOutline,
  refreshOutline,
  personOutline,
  locationOutline,
  cashOutline,
  chatboxOutline,
  documentTextOutline,
  bicycleOutline,
  checkmarkDoneOutline,
  wifi,
  wifiOutline,
} from 'ionicons/icons';
import { Subscription, interval } from 'rxjs';

addIcons({
  'checkmark-circle-outline': checkmarkCircleOutline,
  'restaurant-outline': restaurantOutline,
  'time-outline': timeOutline,
  'close-circle-outline': closeCircleOutline,
  'refresh-outline': refreshOutline,
  'person-outline': personOutline,
  'location-outline': locationOutline,
  'cash-outline': cashOutline,
  'chatbox-outline': chatboxOutline,
  'document-text-outline': documentTextOutline,
  'bicycle-outline': bicycleOutline,
  'checkmark-done-outline': checkmarkDoneOutline,
  wifi: wifi,
  'wifi-outline': wifiOutline,
});

@Component({
  selector: 'app-restaurant-orders',
  templateUrl: './restaurant-orders.page.html',
  styleUrls: ['./restaurant-orders.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonList,
    IonItem,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonBadge,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
    IonChip,
  ],
})
export class RestaurantOrdersPage implements OnInit, OnDestroy {
  private orderService = inject(OrderService);
  private socketService = inject(SocketService);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);

  selectedSegment: 'pending' | 'preparing' | 'completed' = 'pending';
  orders: Order[] = [];
  loading = false;
  isSocketConnected = false;
  private subscriptions: Subscription[] = [];

  ngOnInit() {
    this.loadOrders();
    this.setupSocketConnection();
    this.setupAutoRefresh();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  /**
   * Configura la conexión de Socket.IO
   */
  private setupSocketConnection(): void {
    const token = localStorage.getItem('access_token');
    if (token) {
      this.socketService.connect(token);

      // Suscribirse al estado de conexión
      const connectionSub = this.socketService.isConnected$.subscribe(
        (connected) => {
          this.isSocketConnected = connected;
          if (connected) {
            console.log('🔌 Socket conectado - Restaurante escuchando pedidos');
          }
        }
      );
      this.subscriptions.push(connectionSub);

      // Escuchar cambios de estado de pedidos en tiempo real
      const statusUpdateSub = this.socketService.orderStatusUpdated$.subscribe(
        (update) => {
          if (update) {
            console.log(
              '🔄 Estado de pedido actualizado, recargando lista...',
              update
            );
            this.loadOrders(true);
          }
        }
      );
      this.subscriptions.push(statusUpdateSub);

      // Escuchar nuevos pedidos
      const newOrderSub = this.socketService.newOrder$.subscribe(
        async (notification) => {
          if (notification) {
            console.log('🆕 Nuevo pedido recibido:', notification);

            // Mostrar notificación toast
            const toast = await this.toastCtrl.create({
              message: `🔔 Nuevo pedido de ${notification.restaurantName}`,
              duration: 5000,
              color: 'success',
              position: 'top',
              buttons: [
                {
                  text: 'Ver',
                  handler: () => {
                    this.selectedSegment = 'pending';
                    this.loadOrders();
                  },
                },
              ],
            });
            await toast.present();

            // Recargar automáticamente si estamos en la pestaña de pendientes
            if (this.selectedSegment === 'pending') {
              this.loadOrders(true);
            }
          }
        }
      );
      this.subscriptions.push(newOrderSub);
    }
  }

  /**
   * Configura actualización automática cada 30 segundos (backup del Socket.IO)
   */
  private setupAutoRefresh(): void {
    const refreshSub = interval(30000).subscribe(() => {
      console.log('🔄 Auto-refresh: recargando pedidos del restaurante...');
      this.loadOrders(true);
    });
    this.subscriptions.push(refreshSub);
  }

  /**
   * Carga pedidos según el segmento seleccionado
   */
  async loadOrders(silent = false) {
    if (!silent) {
      this.loading = true;
    }

    try {
      let status: string | undefined;

      switch (this.selectedSegment) {
        case 'pending':
          status = OrderStatus.PENDING;
          break;
        case 'preparing':
          // Obtener todos los pedidos en proceso (confirmados, preparando y listos)
          const confirmed = await this.orderService
            .getOrdersByStatus(OrderStatus.CONFIRMED)
            .toPromise();
          const preparing = await this.orderService
            .getOrdersByStatus(OrderStatus.PREPARING)
            .toPromise();
          const ready = await this.orderService
            .getOrdersByStatus(OrderStatus.READY_FOR_PICKUP)
            .toPromise();
          this.orders = [
            ...(confirmed || []),
            ...(preparing || []),
            ...(ready || []),
          ].sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          this.loading = false;
          return;
        case 'completed':
          // Obtener pedidos completados o entregados
          const completed = await this.orderService
            .getOrdersByStatus(OrderStatus.DELIVERED)
            .toPromise();
          const outForDelivery = await this.orderService
            .getOrdersByStatus(OrderStatus.OUT_FOR_DELIVERY)
            .toPromise();
          this.orders = [...(completed || []), ...(outForDelivery || [])].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          this.loading = false;
          return;
      }

      const orders = await this.orderService
        .getOrdersByStatus(status)
        .toPromise();
      this.orders = (orders || []).sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error loading orders:', error);
      await this.showToast('Error al cargar pedidos', 'danger');
    } finally {
      this.loading = false;
    }
  }

  /**
   * Cambia el segmento y recarga pedidos
   */
  onSegmentChange(event: any) {
    this.selectedSegment = event.detail.value;
    this.loadOrders();
  }

  /**
   * Refresca la lista de pedidos
   */
  async handleRefresh(event: any) {
    await this.loadOrders(true);
    event.target.complete();
  }

  /**
   * Confirma un pedido (PENDING -> CONFIRMED) con selector de tiempo
   */
  async confirmOrder(order: Order) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Pedido',
      message: `Pedido #${order.id.substring(
        0,
        8
      )}<br><br>¿Cuánto tiempo necesitas para prepararlo?`,
      inputs: [
        {
          name: 'prepTime',
          type: 'radio',
          label: '10 minutos',
          value: '10',
          checked: false,
        },
        {
          name: 'prepTime',
          type: 'radio',
          label: '15 minutos',
          value: '15',
          checked: true,
        },
        {
          name: 'prepTime',
          type: 'radio',
          label: '20 minutos',
          value: '20',
          checked: false,
        },
        {
          name: 'prepTime',
          type: 'radio',
          label: '25 minutos',
          value: '25',
          checked: false,
        },
        {
          name: 'prepTime',
          type: 'radio',
          label: '30 minutos',
          value: '30',
          checked: false,
        },
        {
          name: 'prepTime',
          type: 'radio',
          label: '40 minutos',
          value: '40',
          checked: false,
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Confirmar',
          handler: async (data) => {
            const prepTime = parseInt(data) || 15;
            try {
              this.loading = true;
              await this.orderService
                .confirmOrder(order.id, prepTime)
                .toPromise();
              await this.showToast(
                `Pedido confirmado. Listo en ~${prepTime} min`,
                'success'
              );
              // Cambiar automáticamente al tab "Preparación"
              this.selectedSegment = 'preparing';
              await this.loadOrders();
            } catch (error: any) {
              console.error('Error confirming order:', error);
              await this.showToast(
                error?.error?.message || 'Error al confirmar pedido',
                'danger'
              );
            } finally {
              this.loading = false;
            }
          },
        },
      ],
    });

    await alert.present();
  }

  /**
   * Marca un pedido como LISTO PARA RECOGER
   */
  async markAsReady(order: Order) {
    const alert = await this.alertCtrl.create({
      header: 'Pedido Listo',
      message: `¿El pedido #${order.id.substring(
        0,
        8
      )} está listo para que el driver lo recoja?`,
      buttons: [
        {
          text: 'No',
          role: 'cancel',
        },
        {
          text: 'Sí, está listo',
          handler: async () => {
            try {
              this.loading = true;
              await this.orderService
                .markAsReadyForPickup(order.id)
                .toPromise();
              await this.showToast('Pedido marcado como listo', 'success');
              await this.loadOrders();
            } catch (error: any) {
              console.error('Error marking order as ready:', error);
              await this.showToast(
                error?.error?.message || 'Error al marcar pedido',
                'danger'
              );
            } finally {
              this.loading = false;
            }
          },
        },
      ],
    });

    await alert.present();
  }

  /**
   * Necesita más tiempo para preparar
   */
  async needMoreTime(order: Order) {
    const alert = await this.alertCtrl.create({
      header: 'Ajustar Tiempo',
      message: '¿Cuántos minutos adicionales necesitas?',
      inputs: [
        {
          name: 'additionalTime',
          type: 'radio',
          label: '+5 minutos',
          value: '5',
          checked: false,
        },
        {
          name: 'additionalTime',
          type: 'radio',
          label: '+10 minutos',
          value: '10',
          checked: true,
        },
        {
          name: 'additionalTime',
          type: 'radio',
          label: '+15 minutos',
          value: '15',
          checked: false,
        },
        {
          name: 'additionalTime',
          type: 'radio',
          label: '+20 minutos',
          value: '20',
          checked: false,
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Ajustar',
          handler: async (data) => {
            const additionalMinutes = parseInt(data) || 10;
            try {
              this.loading = true;
              await this.orderService
                .adjustPrepTime(order.id, additionalMinutes)
                .toPromise();
              await this.showToast(
                `Tiempo ajustado. +${additionalMinutes} min`,
                'success'
              );
              await this.loadOrders();
            } catch (error: any) {
              console.error('Error adjusting time:', error);
              await this.showToast(
                error?.error?.message || 'Error al ajustar tiempo',
                'danger'
              );
            } finally {
              this.loading = false;
            }
          },
        },
      ],
    });

    await alert.present();
  }

  /**
   * Inicia preparación manual (para casos edge)
   */
  async startPreparing(order: Order) {
    const alert = await this.alertCtrl.create({
      header: 'Iniciar Preparación',
      message: `¿Iniciar preparación del pedido #${order.id.substring(0, 8)}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Iniciar',
          handler: async () => {
            try {
              this.loading = true;
              await this.orderService.startPreparing(order.id).toPromise();
              await this.showToast('Preparación iniciada', 'success');
              await this.loadOrders();
            } catch (error: any) {
              console.error('Error confirming order:', error);
              await this.showToast(
                error?.error?.message || 'Error al confirmar pedido',
                'danger'
              );
            } finally {
              this.loading = false;
            }
          },
        },
      ],
    });

    await alert.present();
  }

  /**
   * Cancela un pedido
   */
  async cancelOrder(order: Order) {
    const alert = await this.alertCtrl.create({
      header: 'Cancelar Pedido',
      message: `¿Estás seguro de cancelar el pedido #${order.id.substring(
        0,
        8
      )}?`,
      inputs: [
        {
          name: 'reason',
          type: 'textarea',
          placeholder: 'Motivo de cancelación (opcional)',
        },
      ],
      buttons: [
        {
          text: 'No',
          role: 'cancel',
        },
        {
          text: 'Sí, Cancelar',
          role: 'destructive',
          handler: async () => {
            try {
              this.loading = true;
              await this.orderService.cancelOrder(order.id).toPromise();
              await this.showToast('Pedido cancelado', 'warning');
              await this.loadOrders();
            } catch (error: any) {
              console.error('Error canceling order:', error);
              await this.showToast(
                error?.error?.message || 'Error al cancelar pedido',
                'danger'
              );
            } finally {
              this.loading = false;
            }
          },
        },
      ],
    });

    await alert.present();
  }

  /**
   * Obtiene el color del badge según el estado
   */
  getStatusColor(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.PENDING:
        return 'warning';
      case OrderStatus.CONFIRMED:
        return 'tertiary';
      case OrderStatus.PREPARING:
        return 'secondary';
      case OrderStatus.OUT_FOR_DELIVERY:
        return 'primary';
      case OrderStatus.DELIVERED:
        return 'success';
      case OrderStatus.CANCELLED:
        return 'danger';
      default:
        return 'medium';
    }
  }

  /**
   * Obtiene el label del estado
   */
  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'confirmed':
        return 'Confirmado';
      case 'preparing':
        return 'Preparando';
      case 'ready_for_pickup':
        return 'Listo para recoger';
      case 'out_for_delivery':
        return 'En camino';
      case 'delivered':
        return 'Entregado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  }

  /**
   * Calcula tiempo restante hasta que el pedido esté listo
   */
  getRemainingTime(order: Order): string {
    if (!order.estimatedReadyTime) return '';

    const now = new Date();
    const readyTime = new Date(order.estimatedReadyTime);
    const diff = readyTime.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes <= 0) return 'Ya debería estar listo';
    if (minutes < 60) return `~${minutes} min`;

    const hours = Math.floor(minutes / 60);
    const remainingMin = minutes % 60;
    return `~${hours}h ${remainingMin}min`;
  }

  /**
   * Verifica si un pedido tiene tiempo estimado
   */
  hasEstimatedTime(order: Order): boolean {
    return !!(order.estimatedReadyTime && order.estimatedPrepTime);
  }

  /**
   * Formatea la fecha de creación
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Hace un momento';
    if (minutes < 60) return `Hace ${minutes} min`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours}h`;

    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Convierte el total a número y formatea con 2 decimales
   */
  formatTotal(total: any): string {
    if (total === null || total === undefined) {
      return '0.00';
    }
    const num = typeof total === 'string' ? parseFloat(total) : total;
    return isNaN(num) ? '0.00' : num.toFixed(2);
  }

  /**
   * Calcula el total de un item (quantity * unit_price)
   */
  getItemTotal(item: any): string {
    const quantity = item.quantity || 0;
    const unitPrice = item.unit_price || item.unitPrice || item.price || 0;
    const total =
      quantity *
      (typeof unitPrice === 'string' ? parseFloat(unitPrice) : unitPrice);
    return this.formatTotal(total);
  }

  /**
   * Verifica si un item tiene opciones personalizadas
   */
  hasOptions(item: any): boolean {
    return !!(item.options?.groups && item.options.groups.length > 0);
  }

  /**
   * Obtiene las opciones personalizadas de un item
   */
  getItemOptions(item: any): any[] {
    if (!item.options?.groups) return [];
    return item.options.groups.filter(
      (g: any) => g.options && g.options.length > 0
    );
  }

  /**
   * Formatea un precio individual
   */
  formatPrice(price: any): string {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(num) ? '0.00' : num.toFixed(2);
  }

  /**
   * Muestra un mensaje toast
   */
  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'top',
    });
    await toast.present();
  }
}
