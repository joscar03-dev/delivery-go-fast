import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonicModule,
  LoadingController,
  AlertController,
  ToastController,
} from '@ionic/angular';
import { RestaurantApplicationService } from '../../../services/restaurant-application.service';
import {
  RestaurantApplication,
  ApplicationStatus,
} from '../../../models/restaurant-application.model';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-admin-restaurant-application-detail',
  templateUrl: './admin-restaurant-application-detail.page.html',
  styleUrls: ['./admin-restaurant-application-detail.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class AdminRestaurantApplicationDetailPage implements OnInit {
  application: RestaurantApplication | null = null;
  isLoading = false;
  applicationId: string = '';

  // Enums para template
  ApplicationStatus = ApplicationStatus;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private restaurantApplicationService: RestaurantApplicationService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.applicationId = this.route.snapshot.paramMap.get('id') || '';
    if (this.applicationId) {
      this.loadApplication();
    }
  }

  async loadApplication() {
    this.isLoading = true;
    try {
      this.application = await firstValueFrom(
        this.restaurantApplicationService.getByIdAdmin(this.applicationId)
      );
    } catch (error) {
      console.error('Error loading application:', error);
      await this.showToast('Error al cargar la solicitud', 'danger');
      this.router.navigate(['/admin/restaurant-applications']);
    } finally {
      this.isLoading = false;
    }
  }

  async approveApplication() {
    const alert = await this.alertCtrl.create({
      header: '¿Aprobar Solicitud?',
      message:
        'Esta acción aprobará la solicitud y cambiará el rol del usuario a propietario de restaurante.',
      inputs: [
        {
          name: 'adminNotes',
          type: 'textarea',
          placeholder: 'Notas del administrador (opcional)',
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Aprobar',
          handler: async (data) => {
            await this.performApprove(data.adminNotes);
          },
        },
      ],
    });

    await alert.present();
  }

  async performApprove(adminNotes?: string) {
    const loading = await this.loadingCtrl.create({
      message: 'Aprobando solicitud...',
    });
    await loading.present();

    try {
      await firstValueFrom(
        this.restaurantApplicationService.approveAndCreateRestaurant(
          this.applicationId,
          adminNotes
        )
      );

      await loading.dismiss();
      await this.showToast(
        'Solicitud aprobada. El usuario ahora puede crear su restaurante.',
        'success'
      );
      await this.loadApplication();
    } catch (error: any) {
      await loading.dismiss();
      console.error('Error approving application:', error);
      const message = error?.error?.message || 'Error al aprobar la solicitud';
      await this.showToast(message, 'danger');
    }
  }

  async rejectApplication() {
    const alert = await this.alertCtrl.create({
      header: '¿Rechazar Solicitud?',
      message: 'El usuario podrá enviar una nueva solicitud en el futuro.',
      inputs: [
        {
          name: 'reason',
          type: 'textarea',
          placeholder: 'Razón del rechazo (requerido)',
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Rechazar',
          cssClass: 'alert-button-danger',
          handler: async (data) => {
            if (!data.reason || data.reason.trim() === '') {
              this.showToast('Debes especificar una razón', 'warning');
              return false;
            }
            await this.performReject(data.reason);
            return true;
          },
        },
      ],
    });

    await alert.present();
  }

  async performReject(reason: string) {
    const loading = await this.loadingCtrl.create({
      message: 'Rechazando solicitud...',
    });
    await loading.present();

    try {
      await firstValueFrom(
        this.restaurantApplicationService.reject(this.applicationId, reason)
      );

      await loading.dismiss();
      await this.showToast('Solicitud rechazada', 'success');
      await this.loadApplication();
    } catch (error: any) {
      await loading.dismiss();
      console.error('Error rejecting application:', error);
      const message = error?.error?.message || 'Error al rechazar la solicitud';
      await this.showToast(message, 'danger');
    }
  }

  async updateStatus(status: ApplicationStatus) {
    const statusNames = {
      [ApplicationStatus.PENDING]: 'Pendiente',
      [ApplicationStatus.UNDER_REVIEW]: 'En Revisión',
      [ApplicationStatus.APPROVED]: 'Aprobada',
      [ApplicationStatus.REJECTED]: 'Rechazada',
    };

    const alert = await this.alertCtrl.create({
      header: `¿Cambiar estado a ${statusNames[status]}?`,
      inputs: [
        {
          name: 'adminNotes',
          type: 'textarea',
          placeholder: 'Notas (opcional)',
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Cambiar',
          handler: async (data) => {
            await this.performStatusUpdate(status, data.adminNotes);
          },
        },
      ],
    });

    await alert.present();
  }

  async performStatusUpdate(status: ApplicationStatus, adminNotes?: string) {
    const loading = await this.loadingCtrl.create({
      message: 'Actualizando estado...',
    });
    await loading.present();

    try {
      await firstValueFrom(
        this.restaurantApplicationService.updateStatus(
          this.applicationId,
          status,
          adminNotes
        )
      );

      await loading.dismiss();
      await this.showToast('Estado actualizado', 'success');
      await this.loadApplication();
    } catch (error: any) {
      await loading.dismiss();
      console.error('Error updating status:', error);
      const message = error?.error?.message || 'Error al actualizar el estado';
      await this.showToast(message, 'danger');
    }
  }

  async deleteApplication() {
    const alert = await this.alertCtrl.create({
      header: '¿Eliminar Solicitud?',
      message: 'Esta acción no se puede deshacer.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          cssClass: 'alert-button-danger',
          handler: async () => {
            await this.performDelete();
          },
        },
      ],
    });

    await alert.present();
  }

  async performDelete() {
    const loading = await this.loadingCtrl.create({
      message: 'Eliminando solicitud...',
    });
    await loading.present();

    try {
      await firstValueFrom(
        this.restaurantApplicationService.delete(this.applicationId)
      );

      await loading.dismiss();
      await this.showToast('Solicitud eliminada', 'success');
      this.router.navigate(['/admin/restaurant-applications']);
    } catch (error: any) {
      await loading.dismiss();
      console.error('Error deleting application:', error);
      const message = error?.error?.message || 'Error al eliminar la solicitud';
      await this.showToast(message, 'danger');
    }
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
