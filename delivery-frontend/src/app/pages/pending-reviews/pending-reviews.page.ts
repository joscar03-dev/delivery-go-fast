import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonLabel,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonSpinner,
  IonNote,
  IonBadge,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  ToastController,
} from '@ionic/angular/standalone';
import { OrderService } from '../../services/order.service';
import type { Order } from '../../models/order.model';
import { addIcons } from 'ionicons';
import {
  clipboardOutline,
  checkmarkCircleOutline,
  timeOutline,
  restaurantOutline,
} from 'ionicons/icons';

// Registrar iconos
addIcons({
  'clipboard-outline': clipboardOutline,
  'checkmark-circle-outline': checkmarkCircleOutline,
  'time-outline': timeOutline,
  'restaurant-outline': restaurantOutline,
});

@Component({
  selector: 'app-pending-reviews',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonList,
    IonItem,
    IonLabel,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonSpinner,
    IonNote,
    IonBadge,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
  ],
  templateUrl: './pending-reviews.page.html',
  styleUrls: ['./pending-reviews.page.scss'],
})
export class PendingReviewsPage implements OnInit {
  private orderService = inject(OrderService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);

  pendingOrders: Order[] = [];
  loading = false;

  ngOnInit() {
    this.loadPendingReviews();
  }

  loadPendingReviews() {
    this.loading = true;
    this.orderService.getPendingReviews().subscribe({
      next: (orders) => {
        this.pendingOrders = orders;
        this.loading = false;
        console.log(`📋 ${orders.length} encuestas pendientes cargadas`);
      },
      error: async (err) => {
        this.loading = false;
        console.error('Error cargando encuestas pendientes:', err);
        const toast = await this.toastCtrl.create({
          message: 'Error al cargar encuestas pendientes',
          duration: 2000,
          color: 'danger',
        });
        await toast.present();
      },
    });
  }

  handleRefresh(event: any) {
    this.orderService.getPendingReviews().subscribe({
      next: (orders) => {
        this.pendingOrders = orders;
        event.target.complete();
      },
      error: () => {
        event.target.complete();
      },
    });
  }

  goToSurvey(orderId: string) {
    this.router.navigate(['/survey', orderId]);
  }

  formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
