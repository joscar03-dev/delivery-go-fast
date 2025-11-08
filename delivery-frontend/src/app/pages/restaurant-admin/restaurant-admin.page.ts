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
  IonSpinner,
  IonNote,
  ToastController,
  IonButtons,
  IonBackButton,
  ViewWillEnter,
  IonRefresher,
  IonRefresherContent,
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
    IonSpinner,
    IonNote,
    IonButtons,
    IonBackButton,
    IonRefresher,
    IonRefresherContent,
  ],
})
export class RestaurantAdminPage implements OnInit, ViewWillEnter {
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
    // Se ejecuta solo una vez al inicializar el componente
    this.loadMyRestaurants();
  }

  ionViewWillEnter() {
    // Se ejecuta cada vez que la vista está a punto de ser mostrada
    // Incluye cuando se navega de regreso desde otras páginas
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

  async handleRefresh(event: any) {
    // Método para el pull-to-refresh
    try {
      this.myRestaurants =
        (await this.restaurantService.getMyRestaurants().toPromise()) || [];
      await this.showToast('Restaurantes actualizados', 'success');
    } catch (error) {
      console.error('Error al actualizar restaurantes:', error);
      await this.showToast('Error al actualizar', 'danger');
    } finally {
      // Finalizar el refresh
      event.target.complete();
    }
  }

  goToRestaurantDetail(restaurantId: string) {
    // Navegar al formulario de edición del restaurante
    this.router.navigate(['/restaurant-edit'], {
      queryParams: { id: restaurantId },
    });
  }

  goToDeliveryConfig(restaurantId: string) {
    this.router.navigate([
      '/tabs/restaurant-admin',
      restaurantId,
      'delivery-config',
    ]);
  }

  goToMenuManagement(restaurantId: string) {
    // Navegar a la gestión de items del menú
    this.router.navigate(['/restaurant-menu-items', restaurantId]);
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
