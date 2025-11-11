import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonToggle,
  IonButton,
  IonSpinner,
  IonNote,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  ToastController,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  saveOutline,
  cashOutline,
  timeOutline,
  locationOutline,
  closeCircleOutline,
  bicycleOutline,
  rocketOutline,
  informationCircleOutline,
} from 'ionicons/icons';
import { RestaurantService } from '../../services/restaurant.service';

@Component({
  selector: 'app-delivery-config',
  templateUrl: './delivery-config.page.html',
  styleUrls: ['./delivery-config.page.scss'],
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
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonToggle,
    IonButton,
    IonSpinner,
    IonNote,
    IonIcon,
    IonSegment,
    IonSegmentButton,
  ],
})
export class DeliveryConfigPage implements OnInit {
  restaurantId: string = '';
  restaurantName: string = '';
  isLoading = false;
  isSaving = false;

  deliveryConfig = {
    deliveryFee: 5.0,
    freeDeliveryThreshold: 0,
    minOrderAmount: 0,
    maxDeliveryDistance: 10,
    estimatedDeliveryTime: 30,
    isDeliveryEnabled: true,
    deliveryType: 'platform', // Nuevo campo: 'none' | 'restaurant' | 'platform'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private restaurantService: RestaurantService,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    addIcons({
      saveOutline,
      cashOutline,
      timeOutline,
      locationOutline,
      closeCircleOutline,
      bicycleOutline,
      rocketOutline,
      informationCircleOutline,
    });
  }

  ngOnInit() {
    this.restaurantId = this.route.snapshot.paramMap.get('id') || '';
    this.loadDeliveryConfig();
  }

  async loadDeliveryConfig() {
    this.isLoading = true;
    try {
      const config = await this.restaurantService
        .getDeliveryConfig(this.restaurantId)
        .toPromise();
      if (config) {
        // Asegurar que todos los valores numéricos sean válidos, nunca null
        this.deliveryConfig = {
          deliveryFee: Number(config.deliveryFee ?? 5.0) || 5.0,
          freeDeliveryThreshold: Number(config.freeDeliveryThreshold ?? 0) || 0,
          minOrderAmount: Number(config.minOrderAmount ?? 0) || 0,
          maxDeliveryDistance: Number(config.maxDeliveryDistance ?? 10) || 10,
          estimatedDeliveryTime:
            Number(config.estimatedDeliveryTime ?? 30) || 30,
          isDeliveryEnabled: config.isDeliveryEnabled ?? true,
          deliveryType: config.deliveryType ?? 'platform',
        };
      }
    } catch (error: any) {
      // Si es 404, significa que no existe configuración aún
      // En ese caso, usamos los valores por defecto sin mostrar error
      if (error?.status === 404 || error?.error?.statusCode === 404) {
        console.log(
          'No existe configuración previa, usando valores por defecto'
        );
        // Los valores por defecto ya están inicializados en deliveryConfig
      } else {
        // Solo mostramos error si es un problema real (no 404)
        console.error('Error al cargar configuración:', error);
        await this.showToast('Error al cargar la configuración', 'danger');
      }
    }

    // Cargar info del restaurante (fuera del try-catch anterior para no afectar el flujo)
    try {
      const restaurant = await this.restaurantService
        .getRestaurantById(this.restaurantId)
        .toPromise();
      if (restaurant) {
        this.restaurantName = restaurant.name;
      }
    } catch (error) {
      console.error('Error al cargar información del restaurante:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async saveConfig() {
    // Validaciones
    if (this.deliveryConfig.deliveryFee < 0) {
      await this.showToast(
        'La tarifa de delivery no puede ser negativa',
        'warning'
      );
      return;
    }

    if (
      this.deliveryConfig.freeDeliveryThreshold > 0 &&
      this.deliveryConfig.freeDeliveryThreshold <=
        this.deliveryConfig.minOrderAmount
    ) {
      await this.showToast(
        'El umbral de delivery gratis debe ser mayor al pedido mínimo',
        'warning'
      );
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar cambios',
      message: '¿Deseas guardar la configuración de delivery?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Guardar',
          handler: () => {
            this.performSave();
          },
        },
      ],
    });

    await alert.present();
  }

  async performSave() {
    this.isSaving = true;
    try {
      // Asegurar que no se envíen valores null al backend
      const configToSave = {
        ...this.deliveryConfig,
        deliveryFee: Number(this.deliveryConfig.deliveryFee) || 0,
        freeDeliveryThreshold:
          Number(this.deliveryConfig.freeDeliveryThreshold) || 0,
        minOrderAmount: Number(this.deliveryConfig.minOrderAmount) || 0,
        estimatedDeliveryTime:
          Number(this.deliveryConfig.estimatedDeliveryTime) || 30,
        maxDeliveryDistance:
          Number(this.deliveryConfig.maxDeliveryDistance) || 5,
      };

      await this.restaurantService
        .updateDeliveryConfig(this.restaurantId, configToSave)
        .toPromise();

      await this.showToast('Configuración guardada exitosamente', 'success');
      this.router.navigate(['/tabs/restaurant-admin']);
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      await this.showToast('Error al guardar la configuración', 'danger');
    } finally {
      this.isSaving = false;
    }
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
