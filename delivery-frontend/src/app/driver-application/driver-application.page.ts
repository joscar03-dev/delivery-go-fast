import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  IonicModule,
  LoadingController,
  AlertController,
  NavController,
} from '@ionic/angular';
import { DriverApplicationService } from '../services/driver-application.service';
import {
  DriverApplication,
  VehicleType,
  ApplicationStatus,
  CreateDriverApplicationDto,
  UpdateDriverApplicationDto,
} from '../models/driver-application.model';
import { firstValueFrom } from 'rxjs';
import { PhotoUploadComponent } from '../components/photo-upload/photo-upload.component';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-driver-application',
  templateUrl: './driver-application.page.html',
  styleUrls: ['./driver-application.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PhotoUploadComponent,
  ],
})
export class DriverApplicationPage implements OnInit {
  application: DriverApplication | null = null;
  stage1Form!: FormGroup;
  stage2Form!: FormGroup;
  currentStage: 1 | 2 = 1;
  isLoading = false;
  isSubmitting = false;

  // Variables para las fotos
  dniPhoto: string | undefined;
  licenseFrontPhoto: string | undefined;
  licenseBackPhoto: string | undefined;
  vehiclePhoto: string | undefined;

  // Enums para las plantillas
  VehicleType = VehicleType;
  ApplicationStatus = ApplicationStatus;

  // Opciones para los selects
  vehicleTypes = [
    { value: VehicleType.MOTO, label: 'Moto' },
    { value: VehicleType.BICICLETA, label: 'Bicicleta' },
    { value: VehicleType.AUTO, label: 'Auto' },
  ];

  constructor(
    private fb: FormBuilder,
    private driverApplicationService: DriverApplicationService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private navCtrl: NavController,
    private authService: AuthService
  ) {
    this.initializeForms();
  }

  ngOnInit() {
    this.loadExistingApplication();
  }

  initializeForms() {
    // Formulario Stage 1: Información básica requerida
    this.stage1Form = this.fb.group({
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      vehicleType: ['', Validators.required],
      birthDate: ['', Validators.required],
    });

    // Formulario Stage 2: Información completa
    this.stage2Form = this.fb.group({
      fullName: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
      email: ['', [Validators.required, Validators.email]],
      licenseNumber: [''],
      licenseExpiry: [''],
      vehiclePlate: [''],
      vehicleBrand: [''],
      vehicleModel: [''],
      vehicleYear: [''],
      emergencyContactName: [''],
      emergencyContactPhone: [''],
    });
  }

  async loadExistingApplication() {
    const loading = await this.loadingCtrl.create({
      message: 'Cargando solicitud...',
    });
    await loading.present();

    try {
      this.application = await firstValueFrom(
        this.driverApplicationService.getMyApplication()
      );

      if (this.application) {
        // Si la solicitud fue aprobada, recargar el usuario para actualizar el rol
        if (this.application.status === ApplicationStatus.APPROVED) {
          await this.handleApprovedApplication();
          await loading.dismiss();
          return;
        }

        // Si existe una solicitud, llenar los formularios
        this.populateForms(this.application);

        // Mostrar stage 2 solo si el admin aprobó la llamada
        if (
          this.application.status === ApplicationStatus.PENDING_COMPLETION ||
          this.application.status === ApplicationStatus.PENDING_REVIEW
        ) {
          this.currentStage = 2;
        }
      }
    } catch (error: any) {
      if (error.status !== 404) {
        console.error('Error loading application:', error);
        await this.showAlert('Error', 'No se pudo cargar la solicitud');
      }
      // Si es 404, significa que no hay solicitud, eso está bien
    } finally {
      await loading.dismiss();
    }
  }

  async handleApprovedApplication() {
    try {
      // Recargar la información del usuario desde el backend para actualizar el rol
      await firstValueFrom(this.authService.reloadCurrentUser());

      const alert = await this.alertCtrl.create({
        header: '¡Felicidades!',
        message:
          '🎉 Tu solicitud ha sido aprobada. Ahora eres un conductor oficial de Delivery Go Fast. La app se recargará para activar tus nuevas funciones.',
        buttons: [
          {
            text: 'Entendido',
            handler: () => {
              // Redirigir al tab de entregas para conductores
              this.navCtrl.navigateRoot('/tabs/delivery-driver');
            },
          },
        ],
        backdropDismiss: false,
      });

      await alert.present();
    } catch (error) {
      console.error('Error al recargar usuario:', error);
      await this.showAlert(
        'Información',
        'Tu solicitud ha sido aprobada. Por favor, cierra sesión y vuelve a iniciar sesión para ver tus nuevas funciones de conductor.'
      );
    }
  }

  populateForms(app: DriverApplication) {
    // Llenar Stage 1
    const birthDate =
      typeof app.birthDate === 'string'
        ? app.birthDate.split('T')[0]
        : new Date(app.birthDate).toISOString().split('T')[0];

    this.stage1Form.patchValue({
      dni: app.dni,
      vehicleType: app.vehicleType,
      birthDate,
    });

    // Llenar Stage 2 si hay datos
    if (app.fullName) {
      const licenseExpiry = app.licenseExpiry
        ? typeof app.licenseExpiry === 'string'
          ? app.licenseExpiry.split('T')[0]
          : new Date(app.licenseExpiry).toISOString().split('T')[0]
        : '';

      this.stage2Form.patchValue({
        fullName: app.fullName,
        phone: app.phone,
        email: app.email,
        licenseNumber: app.licenseNumber,
        licenseExpiry,
        vehiclePlate: app.vehiclePlate,
        vehicleBrand: app.vehicleBrand,
        vehicleModel: app.vehicleModel,
        vehicleYear: app.vehicleYear,
        emergencyContactName: app.emergencyContactName,
        emergencyContactPhone: app.emergencyContactPhone,
      });
    }

    // Cargar fotos si existen
    this.dniPhoto = app.dniPhoto;
    this.licenseFrontPhoto = app.licenseFrontPhoto;
    this.licenseBackPhoto = app.licenseBackPhoto;
    this.vehiclePhoto = app.vehiclePhoto;
  }

  // Método para manejar cambios de fotos
  onPhotoChange(photoType: string, base64: string) {
    switch (photoType) {
      case 'dniPhoto':
        this.dniPhoto = base64;
        break;
      case 'licenseFrontPhoto':
        this.licenseFrontPhoto = base64;
        break;
      case 'licenseBackPhoto':
        this.licenseBackPhoto = base64;
        break;
      case 'vehiclePhoto':
        this.vehiclePhoto = base64;
        break;
    }
  }

  async saveStage1() {
    if (this.stage1Form.invalid) {
      await this.showAlert(
        'Error',
        'Por favor completa todos los campos requeridos'
      );
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Enviando solicitud...',
    });
    await loading.present();

    try {
      const formData: CreateDriverApplicationDto = this.stage1Form.value;

      if (this.application) {
        // Actualizar solicitud existente
        this.application = await firstValueFrom(
          this.driverApplicationService.update(
            this.application.id,
            formData as any
          )
        );
      } else {
        // Crear nueva solicitud
        this.application = await firstValueFrom(
          this.driverApplicationService.create(formData)
        );
      }

      // Enviar Paso 1 para revisión (cambiar a PENDING_CALL)
      this.application = await firstValueFrom(
        this.driverApplicationService.submitStep1(this.application.id)
      );

      await this.showAlert(
        '¡Solicitud enviada!',
        'Tu solicitud ha sido enviada. El administrador te contactará pronto para verificar tu información. Una vez aprobada la llamada, podrás completar el paso 2.',
        true
      );
    } catch (error) {
      console.error('Error saving stage 1:', error);
      await this.showAlert('Error', 'No se pudo enviar la solicitud');
    } finally {
      await loading.dismiss();
    }
  }

  async saveStage2() {
    if (!this.application) {
      await this.showAlert('Error', 'Primero debes completar el paso 1');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Guardando...',
    });
    await loading.present();

    try {
      const formData: UpdateDriverApplicationDto = {
        ...this.stage2Form.value,
        dniPhoto: this.dniPhoto,
        licenseFrontPhoto: this.licenseFrontPhoto,
        licenseBackPhoto: this.licenseBackPhoto,
        vehiclePhoto: this.vehiclePhoto,
      };

      this.application = await firstValueFrom(
        this.driverApplicationService.update(this.application.id, formData)
      );

      await this.showAlert(
        'Éxito',
        'Información guardada. Puedes enviar tu solicitud cuando estés listo.'
      );
    } catch (error) {
      console.error('Error saving stage 2:', error);
      await this.showAlert('Error', 'No se pudo guardar la información');
    } finally {
      await loading.dismiss();
    }
  }

  async submitApplication() {
    if (!this.application) {
      await this.showAlert('Error', 'No hay solicitud para enviar');
      return;
    }

    if (this.stage2Form.invalid) {
      await this.showAlert(
        'Error',
        'Por favor completa todos los campos requeridos'
      );
      return;
    }

    // Confirmar envío
    const alert = await this.alertCtrl.create({
      header: 'Confirmar envío',
      message:
        '¿Estás seguro de que deseas enviar tu solicitud? Una vez enviada, no podrás editarla hasta que sea revisada.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Enviar',
          handler: async () => {
            await this.performSubmit();
          },
        },
      ],
    });

    await alert.present();
  }

  private async performSubmit() {
    if (!this.application) return;

    // Validar que las fotos requeridas estén cargadas
    if (!this.dniPhoto || !this.licenseFrontPhoto || !this.vehiclePhoto) {
      await this.showAlert(
        'Error',
        'Por favor sube todas las fotos requeridas: DNI, Licencia (Frente) y Vehículo'
      );
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Enviando solicitud...',
    });
    await loading.present();

    try {
      // Primero guardar los datos del stage 2 incluyendo las fotos
      const formData: UpdateDriverApplicationDto = {
        ...this.stage2Form.value,
        dniPhoto: this.dniPhoto,
        licenseFrontPhoto: this.licenseFrontPhoto,
        licenseBackPhoto: this.licenseBackPhoto,
        vehiclePhoto: this.vehiclePhoto,
      };

      await firstValueFrom(
        this.driverApplicationService.update(this.application.id, formData)
      );

      // Luego enviar el paso 2 para revisión final
      this.application = await firstValueFrom(
        this.driverApplicationService.submitStep2(this.application.id)
      );

      await this.showAlert(
        '¡Solicitud completa enviada!',
        'Tu solicitud completa ha sido enviada y está en revisión final. Te notificaremos cuando sea aprobada.',
        true
      );
    } catch (error: any) {
      console.error('Error submitting application:', error);
      const message = error.error?.message || 'No se pudo enviar la solicitud';
      await this.showAlert('Error', message);
    } finally {
      await loading.dismiss();
    }
  }

  goToStage1() {
    this.currentStage = 1;
  }

  goToStage2() {
    if (!this.canAccessStep2()) {
      this.showAlert(
        'Error',
        'Debes esperar a que el administrador apruebe tu solicitud inicial para continuar con el paso 2'
      );
      return;
    }
    this.currentStage = 2;
  }

  isApplicationEditable(): boolean {
    return (
      !this.application ||
      this.application.status === ApplicationStatus.DRAFT ||
      this.application.status === ApplicationStatus.PENDING_COMPLETION
    );
  }

  canAccessStep2(): boolean {
    return (
      this.application?.status === ApplicationStatus.PENDING_COMPLETION ||
      this.application?.status === ApplicationStatus.PENDING_REVIEW
    );
  }

  getStatusText(): string {
    if (!this.application) return '';

    switch (this.application.status) {
      case ApplicationStatus.DRAFT:
        return 'Borrador';
      case ApplicationStatus.PENDING_CALL:
        return 'Esperando llamada del administrador';
      case ApplicationStatus.PENDING_COMPLETION:
        return 'Puedes completar el paso 2';
      case ApplicationStatus.PENDING_REVIEW:
        return 'En revisión final';
      case ApplicationStatus.APPROVED:
        return 'Aprobada';
      case ApplicationStatus.REJECTED:
        return 'Rechazada';
      default:
        return '';
    }
  }

  getStatusColor(): string {
    if (!this.application) return 'medium';

    switch (this.application.status) {
      case ApplicationStatus.DRAFT:
        return 'warning';
      case ApplicationStatus.PENDING_CALL:
        return 'primary';
      case ApplicationStatus.PENDING_COMPLETION:
        return 'success';
      case ApplicationStatus.PENDING_REVIEW:
        return 'primary';
      case ApplicationStatus.APPROVED:
        return 'success';
      case ApplicationStatus.REJECTED:
        return 'danger';
      default:
        return 'medium';
    }
  }

  async showAlert(header: string, message: string, navigateBack = false) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: [
        {
          text: 'OK',
          handler: () => {
            if (navigateBack) {
              this.navCtrl.back();
            }
          },
        },
      ],
    });
    await alert.present();
  }

  goBack() {
    this.navCtrl.back();
  }

  getMaxBirthDate(): string {
    // Calcular la fecha mínima (18 años atrás)
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    return date.toISOString().split('T')[0];
  }
}
