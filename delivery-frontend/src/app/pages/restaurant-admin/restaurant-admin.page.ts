import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton,
  IonSpinner,
  IonNote,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  restaurantOutline,
  settingsOutline,
  listOutline,
  receiptOutline,
  statsChartOutline,
  addCircleOutline,
  chevronForwardOutline,
} from 'ionicons/icons';
import { RestaurantService } from '../../services/restaurant.service';

@Component({
  selector: 'app-restaurant-admin',
  templateUrl: './restaurant-admin.page.html',
  styleUrls: ['./restaurant-admin.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonButton,
    IonSpinner,
    IonNote,
  ],
})
export class RestaurantAdminPage implements OnInit {
  myRestaurants: any[] = [];
  isLoading = false;

  constructor(
    private restaurantService: RestaurantService,
    private router: Router,
    private toastController: ToastController
  ) {
    addIcons({
      restaurantOutline,
      settingsOutline,
      listOutline,
      receiptOutline,
      statsChartOutline,
      addCircleOutline,
      chevronForwardOutline,
    });
  }

  ngOnInit() {
    this.loadMyRestaurants();
  }

  async loadMyRestaurants() {
    this.isLoading = true;
    try {
      this.myRestaurants =
        (await this.restaurantService.getMyRestaurants().toPromise()) || [];
    } catch (error) {
      console.error('Error al cargar restaurantes:', error);
      await this.showToast('Error al cargar tus restaurantes', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  goToRestaurantDetail(restaurantId: string) {
    this.router.navigate(['/tabs/restaurant-admin', restaurantId]);
  }

  goToDeliveryConfig(restaurantId: string) {
    this.router.navigate([
      '/tabs/restaurant-admin',
      restaurantId,
      'delivery-config',
    ]);
  }

  goToMenuManagement(restaurantId: string) {
    this.router.navigate(['/tabs/restaurant-admin', restaurantId, 'menu']);
  }

  goToOrders(restaurantId: string) {
    // Navegar al módulo de pedidos del restaurante (fuera de tabs)
    this.router.navigate(['/restaurant-orders'], {
      queryParams: { restaurantId },
    });
  }

  async showToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
