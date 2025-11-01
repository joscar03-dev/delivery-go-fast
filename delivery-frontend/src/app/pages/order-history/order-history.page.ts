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
  IonRefresher,
  IonRefresherContent,
  ToastController,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { SocketService } from '../../services/socket.service';
import { Order, OrderStatus } from '../../models/order.model';
import { addIcons } from 'ionicons';
import {
  timeOutline,
  receiptOutline,
  refreshOutline,
  wifiOutline,
} from 'ionicons/icons';
import { Subscription } from 'rxjs';

addIcons({
  'time-outline': timeOutline,
  'receipt-outline': receiptOutline,
  'refresh-outline': refreshOutline,
  'wifi-outline': wifiOutline,
});

@Component({
  selector: 'app-order-history',
  templateUrl: './order-history.page.html',
  styleUrls: ['./order-history.page.scss'],
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
    IonRefresher,
    IonRefresherContent,
    CommonModule,
    FormsModule,
  ],
})
export class OrderHistoryPage implements OnInit, OnDestroy {
  private orderService = inject(OrderService);
  private socketService = inject(SocketService);
  private toastController = inject(ToastController);
  private router = inject(Router);

  orders: Order[] = [];
  loading = false;
  isSocketConnected = false;

  private subscriptions: Subscription[] = [];

  ngOnInit() {
    console.log('OrderHistory: Inicializando página');

    // Verificar autenticación
    const token = localStorage.getItem('access_token');
    console.log('Token presente:', !!token);

    if (!token) {
      console.log('No hay token, usando datos de prueba');
      this.orders = this.getMockOrders();
      return;
    }

    this.loadOrders();
    this.setupSocketConnection();
  }

  ngOnDestroy() {
    console.log(
      '🔌 OrderHistory: Desconectando Socket.IO y limpiando suscripciones'
    );
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  /**
   * Configura las suscripciones a eventos de Socket.IO para actualizaciones en tiempo real
   */
  private setupSocketConnection(): void {
    console.log('🔌 OrderHistory: Configurando Socket.IO...');

    // Obtener el token y conectar a Socket.IO
    const token = localStorage.getItem('access_token');
    if (token) {
      console.log('🔌 OrderHistory: Conectando a Socket.IO con token...');
      this.socketService.connect(token);
    } else {
      console.warn(
        '⚠️ OrderHistory: No hay token, no se puede conectar a Socket.IO'
      );
    }

    // Suscribirse al estado de conexión
    const connectionSub = this.socketService.isConnected$.subscribe(
      (connected) => {
        this.isSocketConnected = connected;
        console.log('🔌 OrderHistory: Socket.IO conectado:', connected);
      }
    );
    this.subscriptions.push(connectionSub);

    // Escuchar actualizaciones de estado de pedidos
    const statusUpdateSub = this.socketService.orderStatusUpdated$.subscribe(
      (update) => {
        if (update) {
          console.log(
            '📦 OrderHistory: Actualización de estado recibida:',
            update
          );

          // Buscar el pedido en la lista y actualizar su estado
          const orderIndex = this.orders.findIndex(
            (o) => o.id === update.orderId
          );
          if (orderIndex !== -1) {
            const order = this.orders[orderIndex];
            console.log(
              `📦 Actualizando estado de pedido #${order.id} de ${order.status} a ${update.status}`
            );

            // Actualizar el estado del pedido
            this.orders[orderIndex] = {
              ...this.orders[orderIndex],
              status: update.status as OrderStatus,
              updatedAt: new Date().toISOString(),
            };

            // Mostrar notificación
            this.showStatusUpdateToast(order.id, update.status);
          } else {
            // Si el pedido no está en la lista, recargar toda la lista
            console.log(
              '📦 Pedido no encontrado en la lista actual, recargando...'
            );
            this.loadOrders();
          }
        }
      }
    );
    this.subscriptions.push(statusUpdateSub);

    // Escuchar cuando se confirma un nuevo pedido (el cliente acaba de hacer uno)
    const newOrderSub = this.socketService.newOrder$.subscribe((order) => {
      if (order) {
        console.log('🆕 OrderHistory: Nuevo pedido creado:', order);

        // Recargar la lista para incluir el nuevo pedido
        this.loadOrders();

        // Mostrar notificación
        this.showNewOrderToast(order.orderNumber);
      }
    });
    this.subscriptions.push(newOrderSub);

    console.log('✅ OrderHistory: Socket.IO configurado correctamente');
  }

  /**
   * Muestra un toast cuando el estado de un pedido cambia
   */
  private async showStatusUpdateToast(
    orderId: string,
    newStatus: string
  ): Promise<void> {
    const statusText = this.getStatusText(newStatus as OrderStatus);
    const toast = await this.toastController.create({
      message: `📦 Tu pedido ha cambiado a: ${statusText}`,
      duration: 3000,
      position: 'top',
      color: this.getStatusColor(newStatus as OrderStatus),
      icon: 'receipt-outline',
    });
    await toast.present();
  }

  /**
   * Muestra un toast cuando se confirma un nuevo pedido
   */
  private async showNewOrderToast(orderNumber: string): Promise<void> {
    const toast = await this.toastController.create({
      message: `✅ Tu pedido #${orderNumber} ha sido confirmado`,
      duration: 4000,
      position: 'top',
      color: 'success',
      icon: 'receipt-outline',
    });
    await toast.present();
  }

  loadOrders(): void {
    this.loading = true;

    this.orderService.getOrderHistory().subscribe({
      next: (orders) => {
        console.log('Respuesta del servicio:', orders);
        this.orders = orders || [];
        console.log('Pedidos cargados:', this.orders.length);
        console.log('Primer pedido:', this.orders[0]);

        // Si no hay pedidos, usar datos de prueba
        if (this.orders.length === 0) {
          console.log('No hay pedidos, usando datos de prueba');
          this.orders = this.getMockOrders();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);

        // Verificar si es un error de autenticación
        if (error.status === 401 || error.status === 403) {
          console.log('Error de autenticación, redirigiendo al login');
          // Aquí podrías redirigir al login
        }

        // En caso de error, mostrar datos de prueba para development
        console.log('Usando datos de prueba debido al error');
        this.orders = this.getMockOrders();
        this.loading = false;
      },
    });
  }

  private getMockOrders(): Order[] {
    return [
      {
        id: '1',
        client: {
          id: '1',
          name: 'Usuario Test',
          email: 'test@test.com',
          role: 'client',
        },
        restaurant: {
          id: '1',
          name: 'Restaurante Italiano',
          address: 'Av. Principal 123',
          phone: '555-0123',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        status: OrderStatus.DELIVERED,
        total: 45.5,
        notes: 'Sin cebolla por favor',
        deliveryAddress: 'Mi casa 456',
        items: [
          {
            id: '1',
            menuItemId: '1',
            quantity: 2,
            price: 15.5,
            total: 31.0,
            menuItem: {
              id: '1',
              name: 'Pizza Margherita',
              price: 15.5,
              description: 'Pizza clásica italiana',
            },
          },
          {
            id: '2',
            menuItemId: '2',
            quantity: 1,
            price: 14.5,
            total: 14.5,
            menuItem: {
              id: '2',
              name: 'Lasagna Bolognesa',
              price: 14.5,
              description: 'Lasagna tradicional',
            },
          },
        ],
        createdAt: new Date(Date.now() - 86400000).toISOString(), // Ayer
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        client: {
          id: '1',
          name: 'Usuario Test',
          email: 'test@test.com',
          role: 'client',
        },
        restaurant: {
          id: '2',
          name: 'Burger Palace',
          address: 'Calle Comercio 789',
          phone: '555-0456',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        status: OrderStatus.PREPARING,
        total: 28.9,
        items: [
          {
            id: '3',
            menuItemId: '3',
            quantity: 1,
            price: 18.9,
            total: 18.9,
            menuItem: {
              id: '3',
              name: 'Burger Deluxe',
              price: 18.9,
              description: 'Hamburguesa premium',
            },
          },
          {
            id: '4',
            menuItemId: '4',
            quantity: 1,
            price: 10.0,
            total: 10.0,
            menuItem: {
              id: '4',
              name: 'Papas Fritas',
              price: 10.0,
              description: 'Papas crujientes',
            },
          },
        ],
        createdAt: new Date(Date.now() - 3600000).toISOString(), // Hace 1 hora
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  refresh(event: any): void {
    this.loadOrders();
    // Completar el refresh después de un pequeño delay para mejor UX
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }

  goToOrderDetail(orderId: string): void {
    this.router.navigate(['/order-detail', orderId]);
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

  formatDate(dateString: string): string {
    if (!dateString) return 'Fecha no disponible';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Fecha inválida';

      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Fecha no disponible';
    }
  }
}
