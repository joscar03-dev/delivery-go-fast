import { Component, OnInit, inject } from '@angular/core';
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
} from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { Order, OrderStatus } from '../../models/order.model';
import { addIcons } from 'ionicons';
import {
  timeOutline,
  locationOutline,
  restaurantOutline,
  receiptOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
} from 'ionicons/icons';

addIcons({
  'time-outline': timeOutline,
  'location-outline': locationOutline,
  'restaurant-outline': restaurantOutline,
  'receipt-outline': receiptOutline,
  'checkmark-circle-outline': checkmarkCircleOutline,
  'close-circle-outline': closeCircleOutline,
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
    CommonModule,
    FormsModule,
  ],
})
export class OrderDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);

  order: Order | null = null;
  loading = false;

  ngOnInit() {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      this.loadOrderDetail(orderId);
    }
  }

  async loadOrderDetail(orderId: string): Promise<void> {
    this.loading = true;
    try {
      this.order =
        (await this.orderService.getOrderDetail(orderId).toPromise()) || null;
    } catch (error) {
      console.error('Error loading order detail:', error);
    } finally {
      this.loading = false;
    }
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
