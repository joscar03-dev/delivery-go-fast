import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonicModule,
  LoadingController,
  AlertController,
} from '@ionic/angular';
import { Router } from '@angular/router';
import { DriverApplicationService } from '../../../services/driver-application.service';
import {
  DriverApplication,
  ApplicationStatus,
} from '../../../models/driver-application.model';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-admin-driver-applications',
  templateUrl: './admin-driver-applications.page.html',
  styleUrls: ['./admin-driver-applications.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class AdminDriverApplicationsPage implements OnInit {
  applications: DriverApplication[] = [];
  filteredApplications: DriverApplication[] = [];
  isLoading = false;
  selectedStatus: ApplicationStatus | 'all' = 'all';

  // Enums para template
  ApplicationStatus = ApplicationStatus;

  // Opciones de filtro
  statusOptions = [
    { value: 'all', label: 'Todas', color: 'medium' },
    {
      value: ApplicationStatus.PENDING_CALL,
      label: 'Esperando llamada',
      color: 'primary',
    },
    {
      value: ApplicationStatus.PENDING_COMPLETION,
      label: 'Esperando paso 2',
      color: 'warning',
    },
    {
      value: ApplicationStatus.PENDING_REVIEW,
      label: 'En revisión final',
      color: 'tertiary',
    },
    { value: ApplicationStatus.APPROVED, label: 'Aprobadas', color: 'success' },
    { value: ApplicationStatus.REJECTED, label: 'Rechazadas', color: 'danger' },
  ];

  constructor(
    private driverApplicationService: DriverApplicationService,
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
        this.driverApplicationService.getAll()
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

  viewDetail(application: DriverApplication) {
    this.router.navigate(['/admin/driver-applications', application.id]);
  }

  getStatusText(status: ApplicationStatus): string {
    switch (status) {
      case ApplicationStatus.DRAFT:
        return 'Borrador';
      case ApplicationStatus.PENDING_CALL:
        return 'Esperando llamada';
      case ApplicationStatus.PENDING_COMPLETION:
        return 'Puede completar paso 2';
      case ApplicationStatus.PENDING_REVIEW:
        return 'En revisión final';
      case ApplicationStatus.APPROVED:
        return 'Aprobada';
      case ApplicationStatus.REJECTED:
        return 'Rechazada';
      default:
        return status;
    }
  }

  getStatusColor(status: ApplicationStatus): string {
    switch (status) {
      case ApplicationStatus.DRAFT:
        return 'medium';
      case ApplicationStatus.PENDING_CALL:
        return 'primary';
      case ApplicationStatus.PENDING_COMPLETION:
        return 'warning';
      case ApplicationStatus.PENDING_REVIEW:
        return 'tertiary';
      case ApplicationStatus.APPROVED:
        return 'success';
      case ApplicationStatus.REJECTED:
        return 'danger';
      default:
        return 'medium';
    }
  }

  getVehicleTypeLabel(type: string): string {
    const types: { [key: string]: string } = {
      moto: '🏍️ Moto',
      bicicleta: '🚲 Bicicleta',
      auto: '🚗 Auto',
    };
    return types[type] || type;
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
