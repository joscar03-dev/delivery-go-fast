import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonicModule,
  LoadingController,
  AlertController,
  NavController,
} from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { DriverApplicationService } from '../../../services/driver-application.service';
import {
  DriverApplication,
  ApplicationStatus,
} from '../../../models/driver-application.model';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-admin-driver-application-detail',
  templateUrl: './admin-driver-application-detail.page.html',
  styleUrls: ['./admin-driver-application-detail.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class AdminDriverApplicationDetailPage implements OnInit {
  application: DriverApplication | null = null;
  isLoading = false;

  // Enums para template
  ApplicationStatus = ApplicationStatus;

  constructor(
    private route: ActivatedRoute,
    private driverApplicationService: DriverApplicationService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private navCtrl: NavController
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadApplication(id);
    }
  }

  async loadApplication(id: string) {
    const loading = await this.loadingCtrl.create({
      message: 'Cargando solicitud...',
    });
    await loading.present();

    try {
      this.application = await firstValueFrom(
        this.driverApplicationService.getById(id)
      );
    } catch (error) {
      console.error('Error loading application:', error);
      await this.showAlert('Error', 'No se pudo cargar la solicitud');
      this.navCtrl.back();
    } finally {
      await loading.dismiss();
    }
  }

  async approveCall() {
    if (!this.application) return;

    const alert = await this.alertCtrl.create({
      header: 'Aprobar Llamada',
      message: `¿Confirmas que llamaste a ${
        this.application.fullName || 'este usuario'
      } y verificaste su información?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Aprobar',
          handler: async () => {
            await this.performApproveCall();
          },
        },
      ],
    });

    await alert.present();
  }

  private async performApproveCall() {
    if (!this.application) return;

    const loading = await this.loadingCtrl.create({
      message: 'Aprobando llamada...',
    });
    await loading.present();

    try {
      this.application = await firstValueFrom(
        this.driverApplicationService.approveCall(this.application.id)
      );
      await this.showAlert(
        'Llamada Aprobada',
        'El usuario ahora puede completar el paso 2 de su solicitud'
      );
    } catch (error: any) {
      console.error('Error approving call:', error);
      await this.showAlert(
        'Error',
        error.error?.message || 'No se pudo aprobar la llamada'
      );
    } finally {
      await loading.dismiss();
    }
  }

  async approveFinal() {
    if (!this.application) return;

    const alert = await this.alertCtrl.create({
      header: 'Aprobar Solicitud',
      message: `¿Estás seguro de aprobar la solicitud de ${this.application.fullName}? El usuario se convertirá en conductor.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Aprobar',
          handler: async () => {
            await this.performApprove();
          },
        },
      ],
    });

    await alert.present();
  }

  private async performApprove() {
    if (!this.application) return;

    const loading = await this.loadingCtrl.create({
      message: 'Aprobando solicitud...',
    });
    await loading.present();

    try {
      this.application = await firstValueFrom(
        this.driverApplicationService.updateStatus(
          this.application.id,
          ApplicationStatus.APPROVED
        )
      );
      await this.showAlert(
        '¡Solicitud Aprobada!',
        'El usuario ahora es un conductor y puede recibir pedidos'
      );
      this.navCtrl.back();
    } catch (error: any) {
      console.error('Error approving application:', error);
      await this.showAlert(
        'Error',
        error.error?.message || 'No se pudo aprobar la solicitud'
      );
    } finally {
      await loading.dismiss();
    }
  }

  async reject() {
    if (!this.application) return;

    const alert = await this.alertCtrl.create({
      header: 'Rechazar Solicitud',
      message: 'Indica el motivo del rechazo:',
      inputs: [
        {
          name: 'reason',
          type: 'textarea',
          placeholder: 'Motivo del rechazo...',
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Rechazar',
          handler: async (data) => {
            if (!data.reason || data.reason.trim() === '') {
              await this.showAlert(
                'Error',
                'Debes proporcionar un motivo del rechazo'
              );
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

  private async performReject(reason: string) {
    if (!this.application) return;

    const loading = await this.loadingCtrl.create({
      message: 'Rechazando solicitud...',
    });
    await loading.present();

    try {
      this.application = await firstValueFrom(
        this.driverApplicationService.updateStatus(
          this.application.id,
          ApplicationStatus.REJECTED,
          reason
        )
      );
      await this.showAlert(
        'Solicitud Rechazada',
        'El usuario ha sido notificado'
      );
      this.navCtrl.back();
    } catch (error: any) {
      console.error('Error rejecting application:', error);
      await this.showAlert(
        'Error',
        error.error?.message || 'No se pudo rechazar la solicitud'
      );
    } finally {
      await loading.dismiss();
    }
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
      moto: 'Moto',
      bicicleta: 'Bicicleta',
      auto: 'Auto',
    };
    return types[type] || type;
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  goBack() {
    this.navCtrl.back();
  }
}
