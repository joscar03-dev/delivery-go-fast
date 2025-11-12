import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonicModule,
  LoadingController,
  AlertController,
} from '@ionic/angular';
import { Router } from '@angular/router';
import { RestaurantApplicationService } from '../../../services/restaurant-application.service';
import {
  RestaurantApplication,
  ApplicationStatus,
} from '../../../models/restaurant-application.model';
import { firstValueFrom } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  documentTextOutline,
  personOutline,
  locationOutline,
  restaurantOutline,
  callOutline,
  mailOutline,
  timeOutline,
} from 'ionicons/icons';

// Register icons
addIcons({
  'document-text-outline': documentTextOutline,
  'person-outline': personOutline,
  'location-outline': locationOutline,
  'restaurant-outline': restaurantOutline,
  'call-outline': callOutline,
  'mail-outline': mailOutline,
  'time-outline': timeOutline,
});

@Component({
  selector: 'app-admin-restaurant-applications',
  templateUrl: './admin-restaurant-applications.page.html',
  styleUrls: ['./admin-restaurant-applications.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class AdminRestaurantApplicationsPage implements OnInit {
  applications: RestaurantApplication[] = [];
  filteredApplications: RestaurantApplication[] = [];
  isLoading = false;
  selectedStatus: ApplicationStatus | 'all' = 'all';

  // Enums para template
  ApplicationStatus = ApplicationStatus;

  // Opciones de filtro
  statusOptions = [
    { value: 'all', label: 'Todas', color: 'medium' },
    {
      value: ApplicationStatus.PENDING,
      label: 'Pendientes',
      color: 'primary',
    },
    {
      value: ApplicationStatus.UNDER_REVIEW,
      label: 'En Revisión',
      color: 'warning',
    },
    {
      value: ApplicationStatus.APPROVED,
      label: 'Aprobadas',
      color: 'success',
    },
    {
      value: ApplicationStatus.REJECTED,
      label: 'Rechazadas',
      color: 'danger',
    },
  ];

  constructor(
    private restaurantApplicationService: RestaurantApplicationService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadApplications();
  }

  async loadApplications() {
    const loading = await this.loadingCtrl.create({
      message: 'Cargando solicitudes...',
    });
    await loading.present();

    try {
      this.applications = await firstValueFrom(
        this.restaurantApplicationService.getAllAdmin()
      );
      this.filterApplications();
    } catch (error) {
      console.error('Error loading applications:', error);
      await this.showAlert('Error', 'No se pudieron cargar las solicitudes');
    } finally {
      await loading.dismiss();
    }
  }

  filterApplications() {
    if (this.selectedStatus === 'all') {
      this.filteredApplications = this.applications;
    } else {
      this.filteredApplications = this.applications.filter(
        (app) => app.status === this.selectedStatus
      );
    }
  }

  onFilterChange(event: any) {
    this.selectedStatus = event.detail.value;
    this.filterApplications();
  }

  viewDetail(application: RestaurantApplication) {
    this.router.navigate(['/admin/restaurant-applications', application.id]);
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

  getCategoryIcon(categoryName?: string): string {
    if (!categoryName) return '🍽️';

    const icons: { [key: string]: string } = {
      pizza: '🍕',
      pizzeria: '🍕',
      hamburguesa: '🍔',
      burger: '🍔',
      china: '🥡',
      chifa: '🥡',
      japonesa: '🍱',
      sushi: '🍱',
      peruana: '🇵🇪',
      criolla: '🍛',
      pollo: '🍗',
      polleria: '🍗',
      parrilla: '🥩',
      cafe: '☕',
      postres: '🍰',
      bebidas: '🥤',
    };

    const normalizedName = categoryName.toLowerCase();
    for (const [key, icon] of Object.entries(icons)) {
      if (normalizedName.includes(key)) {
        return icon;
      }
    }
    return '🍽️';
  }

  async doRefresh(event: any) {
    await this.loadApplications();
    event.target.complete();
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
