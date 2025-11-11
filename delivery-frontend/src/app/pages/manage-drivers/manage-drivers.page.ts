import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonSpinner,
  IonBadge,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonChip,
  ToastController,
  AlertController,
} from '@ionic/angular/standalone';
import { RestaurantService } from '../../services/restaurant.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { addIcons } from 'ionicons';
import {
  personAddOutline,
  personRemoveOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  personOutline,
  informationCircleOutline,
} from 'ionicons/icons';

addIcons({
  'person-add-outline': personAddOutline,
  'person-remove-outline': personRemoveOutline,
  'checkmark-circle-outline': checkmarkCircleOutline,
  'close-circle-outline': closeCircleOutline,
  'person-outline': personOutline,
  'information-circle-outline': informationCircleOutline,
});

@Component({
  selector: 'app-manage-drivers',
  templateUrl: './manage-drivers.page.html',
  styleUrls: ['./manage-drivers.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonSpinner,
    IonBadge,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonChip,
  ],
})
export class ManageDriversPage implements OnInit {
  private restaurantService = inject(RestaurantService);
  private authService = inject(AuthService);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);

  loading = false;
  restaurantId: string | null = null;
  allDrivers: User[] = [];
  assignedDrivers: User[] = [];

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.loading = true;
    try {
      // Obtener ID del restaurante del usuario autenticado
      const restaurants = await this.restaurantService
        .getMyRestaurants()
        .toPromise();
      if (restaurants && restaurants.length > 0) {
        this.restaurantId = restaurants[0].id;
        await this.loadDrivers();
      } else {
        await this.showToast('No tienes restaurantes registrados', 'warning');
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      await this.showToast(
        error?.error?.message || 'Error al cargar datos',
        'danger'
      );
    } finally {
      this.loading = false;
    }
  }

  async loadDrivers() {
    if (!this.restaurantId) return;

    try {
      // Cargar drivers asignados al restaurante
      this.assignedDrivers =
        (await this.restaurantService
          .getRestaurantDrivers(this.restaurantId)
          .toPromise()) || [];

      // Cargar todos los drivers disponibles
      this.allDrivers =
        (await this.restaurantService.getAllAvailableDrivers().toPromise()) ||
        [];

      console.log('✅ Drivers cargados:', {
        assigned: this.assignedDrivers.length,
        total: this.allDrivers.length,
      });
    } catch (error: any) {
      console.error('Error loading drivers:', error);
      await this.showToast(
        error?.error?.message || 'Error al cargar repartidores',
        'danger'
      );
    }
  }

  isDriverAssigned(driver: User): boolean {
    return this.assignedDrivers.some((d) => d.id === driver.id);
  }

  get unassignedDrivers(): User[] {
    return this.allDrivers.filter((d) => !this.isDriverAssigned(d));
  }

  async assignDriver(driver: User) {
    if (!this.restaurantId) return;

    const alert = await this.alertController.create({
      header: 'Asignar Repartidor',
      message: `¿Deseas agregar a <strong>${driver.name}</strong> como repartidor de tu restaurante?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Asignar',
          handler: async () => {
            try {
              this.loading = true;
              await this.restaurantService
                .assignDriverToRestaurant(this.restaurantId!, driver.id)
                .toPromise();

              await this.showToast(
                `${driver.name} ha sido asignado correctamente`,
                'success'
              );
              await this.loadDrivers();
            } catch (error: any) {
              console.error('Error assigning driver:', error);
              await this.showToast(
                error?.error?.message || 'Error al asignar repartidor',
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

  async removeDriver(driver: User) {
    if (!this.restaurantId) return;

    const alert = await this.alertController.create({
      header: 'Remover Repartidor',
      message: `¿Deseas remover a <strong>${driver.name}</strong> de tu lista de repartidores?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Remover',
          role: 'destructive',
          handler: async () => {
            try {
              this.loading = true;
              await this.restaurantService
                .removeDriverFromRestaurant(this.restaurantId!, driver.id)
                .toPromise();

              await this.showToast(
                `${driver.name} ha sido removido correctamente`,
                'success'
              );
              await this.loadDrivers();
            } catch (error: any) {
              console.error('Error removing driver:', error);
              await this.showToast(
                error?.error?.message || 'Error al remover repartidor',
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

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color,
    });
    await toast.present();
  }
}
