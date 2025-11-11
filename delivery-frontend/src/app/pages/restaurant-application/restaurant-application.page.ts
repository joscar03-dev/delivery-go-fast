import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  IonSpinner,
  IonText,
  ToastController,
  LoadingController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  storefrontOutline,
  callOutline,
  mailOutline,
  locationOutline,
  personOutline,
  cardOutline,
  chatboxOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';
import { RestaurantApplicationService } from '../../services/restaurant-application.service';
import { RestaurantService } from '../../services/restaurant.service';
import {
  City,
  CreateRestaurantApplicationDto,
  RestaurantApplication,
  ApplicationStatus,
} from '../../models/restaurant-application.model';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-restaurant-application',
  templateUrl: './restaurant-application.page.html',
  styleUrls: ['./restaurant-application.page.scss'],
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
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonIcon,
    IonSpinner,
    IonText,
  ],
})
export class RestaurantApplicationPage implements OnInit {
  formData: CreateRestaurantApplicationDto = {
    businessName: '',
    businessPhone: '',
    businessEmail: '',
    address: '',
    categoryId: '',
    city: City.BAGUA,
    ownerName: '',
    ownerDni: '',
    additionalComments: '',
  };

  categories: any[] = [];
  cities = Object.values(City);
  isLoading = false;
  isSubmitting = false;
  existingApplication: RestaurantApplication | null = null;
  hasExistingApplication = false;

  // Enum para template
  ApplicationStatus = ApplicationStatus;

  constructor(
    private restaurantApplicationService: RestaurantApplicationService,
    private restaurantService: RestaurantService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private router: Router
  ) {
    addIcons({
      storefrontOutline,
      callOutline,
      mailOutline,
      locationOutline,
      personOutline,
      cardOutline,
      chatboxOutline,
      checkmarkCircleOutline,
    });
  }

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    try {
      // Cargar categorías
      await this.loadCategories();

      // Verificar si ya tiene una solicitud
      await this.checkExistingApplication();
    } catch (error) {
      console.error('Error loading data:', error);
      await this.showToast(
        'Error al cargar datos. Por favor intenta de nuevo.',
        'danger'
      );
    } finally {
      this.isLoading = false;
    }
  }

  async loadCategories() {
    try {
      this.categories = await firstValueFrom(
        this.restaurantService.listRestaurantCategories()
      );
    } catch (error) {
      console.error('Error loading categories:', error);
      throw error;
    }
  }

  async checkExistingApplication() {
    try {
      this.existingApplication = await firstValueFrom(
        this.restaurantApplicationService.getMyApplication()
      );

      if (this.existingApplication) {
        this.hasExistingApplication = true;
      }
    } catch (error: any) {
      // Si no hay solicitud, error 404 es esperado
      if (error.status !== 404) {
        console.error('Error checking existing application:', error);
      }
    }
  }

  async onSubmit() {
    // Validaciones básicas
    if (!this.validateForm()) {
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Enviando solicitud...',
    });
    await loading.present();

    this.isSubmitting = true;

    try {
      const result = await firstValueFrom(
        this.restaurantApplicationService.create(this.formData)
      );

      await loading.dismiss();
      await this.showToast(
        '¡Solicitud enviada con éxito! Te contactaremos pronto.',
        'success'
      );

      // Navegar a perfil o mostrar estado
      this.router.navigate(['/tabs/profile']);
    } catch (error: any) {
      await loading.dismiss();
      console.error('Error submitting application:', error);

      const message =
        error?.error?.message ||
        'Error al enviar la solicitud. Por favor intenta de nuevo.';
      await this.showToast(message, 'danger');
    } finally {
      this.isSubmitting = false;
    }
  }

  validateForm(): boolean {
    if (!this.formData.businessName.trim()) {
      this.showToast('El nombre del negocio es obligatorio', 'warning');
      return false;
    }

    if (!this.formData.businessPhone.trim()) {
      this.showToast('El teléfono es obligatorio', 'warning');
      return false;
    }

    if (this.formData.businessPhone.length < 7) {
      this.showToast('El teléfono debe tener al menos 7 dígitos', 'warning');
      return false;
    }

    if (!this.formData.address.trim()) {
      this.showToast('La dirección es obligatoria', 'warning');
      return false;
    }

    if (!this.formData.categoryId) {
      this.showToast('Selecciona una categoría', 'warning');
      return false;
    }

    if (!this.formData.city) {
      this.showToast('Selecciona una ciudad', 'warning');
      return false;
    }

    if (!this.formData.ownerName.trim()) {
      this.showToast('El nombre del representante es obligatorio', 'warning');
      return false;
    }

    if (!this.formData.ownerDni.trim()) {
      this.showToast('El DNI del representante es obligatorio', 'warning');
      return false;
    }

    if (this.formData.ownerDni.length < 8) {
      this.showToast('El DNI debe tener al menos 8 dígitos', 'warning');
      return false;
    }

    return true;
  }

  getStatusText(status: ApplicationStatus): string {
    const statusMap = {
      [ApplicationStatus.PENDING]: 'Pendiente',
      [ApplicationStatus.UNDER_REVIEW]: 'En Revisión',
      [ApplicationStatus.APPROVED]: 'Aprobada',
      [ApplicationStatus.REJECTED]: 'Rechazada',
    };
    return statusMap[status] || status;
  }

  getStatusColor(status: ApplicationStatus): string {
    const colorMap = {
      [ApplicationStatus.PENDING]: 'primary',
      [ApplicationStatus.UNDER_REVIEW]: 'warning',
      [ApplicationStatus.APPROVED]: 'success',
      [ApplicationStatus.REJECTED]: 'danger',
    };
    return colorMap[status] || 'medium';
  }

  async showToast(message: string, color: string = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
