import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonSpinner,
  IonText,
  IonIcon,
  IonButtons,
  AlertController,
  LoadingController,
  IonBackButton,
} from '@ionic/angular/standalone';
import { WaveBackgroundComponent } from 'src/app/components/wave-background/wave-background.component';
import { Router } from '@angular/router';
import { PhoneAuthService } from '../../services/phone-auth.service';
import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import { call, arrowBack, checkmarkCircle } from 'ionicons/icons';

import { Auth } from '@angular/fire/auth';
import { FirebaseDiagnostics } from '../../utils/firebase-diagnostics';

@Component({
  selector: 'app-phone-login',
  templateUrl: './phone-login.page.html',
  styleUrls: ['./phone-login.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonInput,
    IonItem,
    IonLabel,
    IonSpinner,
    IonText,
    IonIcon,
    IonButtons,
    CommonModule,
    FormsModule,
    WaveBackgroundComponent,
    IonBackButton,
  ],
})
export class PhoneLoginPage implements OnInit, OnDestroy {
  @ViewChild('recaptchaContainer', { static: false, read: ElementRef })
  recaptchaContainer!: ElementRef;

  // Estados del flujo
  currentStep: 'phone' | 'otp' = 'phone';
  isLoading = false;

  // Datos del formulario
  countryCode = '+51'; // Perú por defecto
  phoneNumber = '';
  otpCode = '';
  fullPhoneNumber = '';
  verificationId = ''; // 🆕 Para apps nativas de Android/iOS

  // Control de reenvío
  canResend = false;
  resendTimer = 60;
  private resendInterval: any;

  // Mensajes
  errorMessage = '';
  successMessage = '';

  constructor(
    private phoneAuthService: PhoneAuthService,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private auth: Auth
  ) {
    addIcons({ call, arrowBack, checkmarkCircle });
  }

  ngOnInit() {
    console.log('📱 PhoneLoginPage inicializada');

    /*  // 🔍 Ejecutar diagnósticos de Firebase
    setTimeout(() => {
      FirebaseDiagnostics.runDiagnostics(this.auth);
    }, 1000); */
  }

  ngOnDestroy() {
    // Limpiar el servicio y timers
    this.phoneAuthService.cleanup();
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
    }
  }

  /**
   * Envía el código OTP al número de teléfono
   */
  async sendOTP() {
    this.errorMessage = '';
    this.successMessage = '';

    // Validación del número
    if (!this.phoneNumber || this.phoneNumber.length < 6) {
      this.errorMessage = 'Ingresa un número de teléfono válido';
      return;
    }

    // Construir número completo en formato E.164
    this.fullPhoneNumber = `${this.countryCode}${this.phoneNumber}`;

    // Validar formato E.164
    if (!this.phoneAuthService.validatePhoneFormat(this.fullPhoneNumber)) {
      this.errorMessage = 'Formato de teléfono inválido. Ejemplo: +51987654321';
      return;
    }

    // Mostrar loading
    const loading = await this.loadingController.create({
      message: 'Enviando código...',
      spinner: 'crescent',
    });
    await loading.present();
    this.isLoading = true;

    try {
      // Inicializar reCAPTCHA
      await new Promise((resolve) => setTimeout(resolve, 100)); // Esperar render
      this.phoneAuthService.initializeRecaptcha('recaptcha-container');

      // Enviar OTP
      this.phoneAuthService.sendOTP(this.fullPhoneNumber).subscribe({
        next: async (response) => {
          await loading.dismiss();
          this.isLoading = false;

          if (response.success) {
            console.log('✅ OTP enviado:', response.verificationId);
            // 🆕 Guardar verificationId para apps nativas
            this.verificationId = response.verificationId || '';
            this.successMessage = 'Código enviado correctamente';
            this.currentStep = 'otp';
            this.startResendTimer();
          }
        },
        error: async (error) => {
          await loading.dismiss();
          this.isLoading = false;
          this.errorMessage = error.message || 'Error al enviar el código';
          console.error('❌ Error al enviar OTP:', error);

          // Mostrar alerta
          const alert = await this.alertController.create({
            header: 'Error',
            message: this.errorMessage,
            buttons: ['OK'],
          });
          await alert.present();
        },
      });
    } catch (error: any) {
      await loading.dismiss();
      this.isLoading = false;
      this.errorMessage = error.message || 'Error al inicializar reCAPTCHA';
      console.error('❌ Error:', error);
    }
  }

  /**
   * Verifica el código OTP ingresado
   */
  async verifyOTP() {
    this.errorMessage = '';
    this.successMessage = '';

    // Validación del código
    if (!this.otpCode || this.otpCode.length !== 6) {
      this.errorMessage = 'Ingresa el código de 6 dígitos';
      return;
    }

    // Mostrar loading
    const loading = await this.loadingController.create({
      message: 'Verificando código...',
      spinner: 'crescent',
    });
    await loading.present();
    this.isLoading = true;

    try {
      // Verificar OTP con Firebase
      // 🆕 Pasar verificationId para apps nativas
      this.phoneAuthService
        .verifyOTP(this.otpCode, this.verificationId)
        .subscribe({
          next: async (response) => {
            if (response.success && response.firebaseToken) {
              console.log('✅ OTP verificado. Token obtenido');

              // Intentar login o registro con el backend
              await this.loginOrRegisterWithBackend(response.firebaseToken);
            }
            await loading.dismiss();
            this.isLoading = false;
          },
          error: async (error) => {
            await loading.dismiss();
            this.isLoading = false;
            this.errorMessage = error.message || 'Código incorrecto';
            console.error('❌ Error al verificar OTP:', error);

            // Mostrar alerta
            const alert = await this.alertController.create({
              header: 'Código incorrecto',
              message: this.errorMessage,
              buttons: ['OK'],
            });
            await alert.present();
          },
        });
    } catch (error: any) {
      await loading.dismiss();
      this.isLoading = false;
      this.errorMessage = error.message || 'Error al verificar el código';
      console.error('❌ Error:', error);
    }
  }

  /**
   * Intenta login, si no existe el usuario, muestra diálogo para registrarse
   */
  private async loginOrRegisterWithBackend(firebaseToken: string) {
    // Primero intentar login
    this.authService
      .loginWithPhone({ phone: this.fullPhoneNumber, firebaseToken })
      .subscribe({
        next: async (response) => {
          console.log('✅ Login exitoso:', response);
          console.log('👤 Usuario:', response.user);

          // Los tokens ya se guardaron en handleAuthResponse()
          // No es necesario guardarlos de nuevo aquí

          // Navegar a tabs
          this.router.navigate(['/tabs'], { replaceUrl: true });
        },
        error: async (error) => {
          console.log('ℹ️ Usuario no existe, mostrando diálogo de registro');

          // Si el usuario no existe (401 o 404), ofrecer registro
          if (error.status === 401 || error.status === 404) {
            await this.showRegistrationDialog(firebaseToken);
          } else {
            // Otro error
            const alert = await this.alertController.create({
              header: 'Error',
              message: error.error?.message || 'Error al iniciar sesión',
              buttons: ['OK'],
            });
            await alert.present();
          }
        },
      });
  }

  /**
   * Muestra diálogo para registrarse si el usuario no existe
   */
  private async showRegistrationDialog(firebaseToken: string) {
    const alert = await this.alertController.create({
      header: 'Usuario no encontrado',
      message: '¿Deseas crear una cuenta nueva con este número?',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Ingresa tu nombre completo',
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Registrarme',
          handler: async (data) => {
            if (!data.name || data.name.trim().length < 2) {
              const errorAlert = await this.alertController.create({
                header: 'Error',
                message: 'El nombre debe tener al menos 2 caracteres',
                buttons: ['OK'],
              });
              await errorAlert.present();
              return false;
            }

            // Registrar usuario
            await this.registerWithBackend(data.name, firebaseToken);
            return true;
          },
        },
      ],
    });

    await alert.present();
  }

  /**
   * Registra el usuario en el backend
   */
  private async registerWithBackend(name: string, firebaseToken: string) {
    const loading = await this.loadingController.create({
      message: 'Creando cuenta...',
      spinner: 'crescent',
    });
    await loading.present();

    this.authService
      .registerWithPhone({
        name,
        phone: this.fullPhoneNumber,
        firebaseToken,
      })
      .subscribe({
        next: async (response) => {
          console.log('✅ Registro exitoso:', response);
          console.log('👤 Usuario creado:', response.user);
          await loading.dismiss();

          // Los tokens ya se guardaron en handleAuthResponse()
          // No es necesario guardarlos de nuevo aquí

          // Mostrar mensaje de bienvenida
          const alert = await this.alertController.create({
            header: '¡Bienvenido! 🎉',
            message: 'Tu cuenta ha sido creada exitosamente',
            buttons: ['OK'],
          });
          await alert.present();

          // Navegar a tabs
          this.router.navigate(['/tabs'], { replaceUrl: true });
        },
        error: async (error) => {
          await loading.dismiss();
          console.error('❌ Error al registrar:', error);

          const alert = await this.alertController.create({
            header: 'Error',
            message: error.error?.message || 'Error al crear la cuenta',
            buttons: ['OK'],
          });
          await alert.present();
        },
      });
  }

  /**
   * Inicia el temporizador de reenvío
   */
  private startResendTimer() {
    this.canResend = false;
    this.resendTimer = 60;

    this.resendInterval = setInterval(() => {
      this.resendTimer--;
      if (this.resendTimer <= 0) {
        this.canResend = true;
        clearInterval(this.resendInterval);
      }
    }, 1000);
  }

  /**
   * Reenvía el código OTP
   */
  async resendOTP() {
    if (!this.canResend) return;

    this.errorMessage = '';
    this.successMessage = '';

    const loading = await this.loadingController.create({
      message: 'Reenviando código...',
      spinner: 'crescent',
    });
    await loading.present();

    this.phoneAuthService.resendOTP(this.fullPhoneNumber).subscribe({
      next: async (response) => {
        await loading.dismiss();
        if (response.success) {
          this.successMessage = 'Código reenviado correctamente';
          this.startResendTimer();
        }
      },
      error: async (error) => {
        await loading.dismiss();
        this.errorMessage = error.message || 'Error al reenviar el código';
        console.error('❌ Error al reenviar:', error);
      },
    });
  }

  /**
   * Vuelve al paso anterior
   */
  goBack() {
    if (this.currentStep === 'otp') {
      this.currentStep = 'phone';
      this.otpCode = '';
      this.errorMessage = '';
      this.successMessage = '';
      if (this.resendInterval) {
        clearInterval(this.resendInterval);
      }
    } else {
      this.router.navigate(['/auth/login']);
    }
  }
}
