import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  IonButtons,
  IonBackButton,
  IonContent,
  IonButton,
  IonSpinner,
  IonText,
  IonItem,
  IonIcon,
  IonLabel,
  AlertController,
  LoadingController,
  ToastController,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { PhoneAuthService } from '../../services/phone-auth.service';
import type { User } from '../../models/user.model';
import { WaveBackgroundComponent } from '../../components/wave-background/wave-background.component';
import { addIcons } from 'ionicons';
import {
  receiptOutline,
  chevronForwardOutline,
  locationOutline,
  personCircleOutline,
  bicycleOutline,
  storefrontOutline,
  headsetOutline,
  documentTextOutline,
  shieldCheckmarkOutline,
  logOutOutline,
  trashOutline,
  callOutline,
  addCircleOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';

// Register icons
addIcons({
  'receipt-outline': receiptOutline,
  'chevron-forward-outline': chevronForwardOutline,
  'location-outline': locationOutline,
  'person-circle-outline': personCircleOutline,
  'bicycle-outline': bicycleOutline,
  'storefront-outline': storefrontOutline,
  'headset-outline': headsetOutline,
  'document-text-outline': documentTextOutline,
  'shield-checkmark-outline': shieldCheckmarkOutline,
  'log-out-outline': logOutOutline,
  'trash-outline': trashOutline,
  'call-outline': callOutline,
  'add-circle-outline': addCircleOutline,
  'checkmark-circle-outline': checkmarkCircleOutline,
});

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    WaveBackgroundComponent,
    IonButtons,
    IonBackButton,
    IonContent,
    IonButton,
    IonSpinner,
    IonText,
    IonItem,
    IonIcon,
    IonLabel,
  ],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private auth = inject(AuthService);
  private phoneAuthService = inject(PhoneAuthService);
  private router = inject(Router);
  private alertController = inject(AlertController);
  private loadingController = inject(LoadingController);
  private toastController = inject(ToastController);

  user?: User;
  loading = false;
  isLoggedIn = false;
  private authSubscription?: Subscription;

  ngOnInit(): void {
    // Suscribirse a los cambios de usuario
    this.authSubscription = this.auth.currentUser$.subscribe((user) => {
      this.isLoggedIn = !!user;
      if (user) {
        this.user = user;
        this.loading = false;
      } else {
        this.user = undefined;
      }
    });

    // Cargar perfil inicial
    this.loadProfile();
  }

  ngOnDestroy(): void {
    // Limpiar suscripción
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  ionViewWillEnter(): void {
    // Recargar el perfil cada vez que se entra a la página
    // Esto asegura que el rol esté actualizado si fue aprobado como driver
    this.loadProfile();
  }

  private loadProfile(): void {
    // Verificar si hay token
    const token = this.auth.getAccessToken();
    this.isLoggedIn = !!token;

    if (!this.isLoggedIn) {
      // Si no hay sesión, no intentar cargar el perfil
      this.loading = false;
      this.user = undefined;
      return;
    }

    this.loading = true;

    // Primero recargar el usuario actual para actualizar el rol
    this.auth.reloadCurrentUser().subscribe({
      next: () => {
        // Luego obtener el perfil completo
        this.userService.getProfile().subscribe({
          next: (u) => {
            this.user = u;
            this.loading = false;
          },
          error: (err) => {
            console.error('Error loading profile:', err);
            this.loading = false;
            // Si falla la carga, probablemente no hay sesión válida
            this.isLoggedIn = false;
          },
        });
      },
      error: (err) => {
        console.error('Error reloading user:', err);
        // Si falla, intentar cargar el perfil de todas formas
        this.userService.getProfile().subscribe({
          next: (u) => {
            this.user = u;
            this.loading = false;
          },
          error: (err2) => {
            console.error('Error loading profile:', err2);
            this.loading = false;
          },
        });
      },
    });
  }

  logout() {
    this.auth.logout();
    this.isLoggedIn = false;
    this.user = undefined;
    this.router.navigate(['/tabs/business']);
  }

  goToLogin() {
    this.router.navigate(['/auth/login'], {
      queryParams: { redirectUrl: '/tabs/account' },
    });
  }

  goToEditProfile() {
    console.log('🚀 Navigating to edit profile');
    this.router.navigate(['/tabs/edit-profile']);
  }

  goToAddresses() {
    console.log('🚀 Navigating to addresses from profile');
    this.router.navigate(['/tabs/addresses'], {
      state: { returnUrl: '/tabs/account' },
    });
  }

  navigateToDriverApplication() {
    console.log('🚀 Navigating to driver application');
    this.router.navigate(['/driver-application']);
  }

  /**
   * Muestra diálogo para agregar teléfono al perfil
   */
  async addPhoneNumber() {
    const alert = await this.alertController.create({
      header: 'Agregar Teléfono',
      message: 'Ingresa tu número de teléfono para verificarlo',
      inputs: [
        {
          name: 'countryCode',
          type: 'text',
          value: '+51',
          placeholder: 'Código de país',
        },
        {
          name: 'phoneNumber',
          type: 'tel',
          placeholder: 'Número de teléfono',
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Enviar Código',
          handler: async (data) => {
            const fullPhone = `${data.countryCode}${data.phoneNumber}`.trim();

            if (!this.phoneAuthService.validatePhoneFormat(fullPhone)) {
              const errorAlert = await this.alertController.create({
                header: 'Formato inválido',
                message:
                  'El formato debe ser: +[código país][número]. Ejemplo: +51987654321',
                buttons: ['OK'],
              });
              await errorAlert.present();
              return false;
            }

            await this.sendOTPForPhone(fullPhone);
            return true;
          },
        },
      ],
    });

    await alert.present();
  }

  /**
   * Envía OTP al número de teléfono
   */
  private async sendOTPForPhone(phone: string) {
    const loading = await this.loadingController.create({
      message: 'Enviando código...',
      spinner: 'crescent',
    });
    await loading.present();

    try {
      // Inicializar reCAPTCHA
      await new Promise((resolve) => setTimeout(resolve, 100));
      this.phoneAuthService.initializeRecaptcha('recaptcha-container-profile');

      // Enviar OTP
      this.phoneAuthService.sendOTP(phone).subscribe({
        next: async (response) => {
          await loading.dismiss();

          if (response.success) {
            console.log('✅ OTP enviado para agregar teléfono');
            await this.showOTPVerificationDialog(phone);
          }
        },
        error: async (error) => {
          await loading.dismiss();
          console.error('❌ Error al enviar OTP:', error);

          const alert = await this.alertController.create({
            header: 'Error',
            message: error.message || 'No se pudo enviar el código',
            buttons: ['OK'],
          });
          await alert.present();
        },
      });
    } catch (error: any) {
      await loading.dismiss();
      console.error('❌ Error:', error);

      const alert = await this.alertController.create({
        header: 'Error',
        message: error.message || 'Error al inicializar verificación',
        buttons: ['OK'],
      });
      await alert.present();
    }
  }

  /**
   * Muestra diálogo para verificar OTP
   */
  private async showOTPVerificationDialog(phone: string) {
    const alert = await this.alertController.create({
      header: 'Verificar Código',
      message: `Ingresa el código de 6 dígitos enviado a ${phone}`,
      inputs: [
        {
          name: 'otpCode',
          type: 'number',
          placeholder: '123456',
          attributes: {
            maxlength: 6,
          },
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            this.phoneAuthService.cleanup();
          },
        },
        {
          text: 'Verificar',
          handler: async (data) => {
            if (!data.otpCode || data.otpCode.length !== 6) {
              const errorAlert = await this.alertController.create({
                header: 'Código inválido',
                message: 'El código debe tener 6 dígitos',
                buttons: ['OK'],
              });
              await errorAlert.present();
              return false;
            }

            await this.verifyOTPAndAddPhone(phone, data.otpCode);
            return true;
          },
        },
      ],
    });

    await alert.present();
  }

  /**
   * Verifica OTP y agrega teléfono al perfil
   */
  private async verifyOTPAndAddPhone(phone: string, otpCode: string) {
    const loading = await this.loadingController.create({
      message: 'Verificando código...',
      spinner: 'crescent',
    });
    await loading.present();

    this.phoneAuthService.verifyOTP(otpCode).subscribe({
      next: async (response) => {
        if (response.success && response.firebaseToken) {
          console.log('✅ OTP verificado. Agregando teléfono al perfil...');

          // Llamar al backend para agregar el teléfono
          await this.addPhoneToBackend(phone, response.firebaseToken);
        }
        await loading.dismiss();
      },
      error: async (error) => {
        await loading.dismiss();
        console.error('❌ Error al verificar OTP:', error);

        const alert = await this.alertController.create({
          header: 'Código incorrecto',
          message: error.message || 'El código ingresado es incorrecto',
          buttons: ['OK'],
        });
        await alert.present();
      },
    });
  }

  /**
   * Agrega el teléfono verificado al perfil en el backend
   */
  private async addPhoneToBackend(phone: string, firebaseToken: string) {
    const loading = await this.loadingController.create({
      message: 'Actualizando perfil...',
      spinner: 'crescent',
    });
    await loading.present();

    // Usar el endpoint /auth/phone/add del backend
    this.auth.addPhoneToProfile(phone, firebaseToken).subscribe({
      next: async () => {
        await loading.dismiss();
        console.log('✅ Teléfono agregado exitosamente');

        // Mostrar mensaje de éxito
        const toast = await this.toastController.create({
          message: '✅ Teléfono verificado y agregado exitosamente',
          duration: 3000,
          color: 'success',
          position: 'top',
        });
        await toast.present();

        // Recargar perfil para mostrar el teléfono
        this.loadProfile();
      },
      error: async (error) => {
        await loading.dismiss();
        console.error('❌ Error al agregar teléfono:', error);

        const alert = await this.alertController.create({
          header: 'Error',
          message: error.error?.message || 'No se pudo agregar el teléfono',
          buttons: ['OK'],
        });
        await alert.present();
      },
    });
  }
}
