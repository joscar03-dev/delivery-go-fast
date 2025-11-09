import { Injectable } from '@angular/core';
import {
  Auth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  PhoneAuthProvider,
  signInWithCredential,
} from '@angular/fire/auth';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

export interface PhoneAuthResponse {
  success: boolean;
  message: string;
  verificationId?: string;
  firebaseToken?: string;
  error?: any;
}

@Injectable({
  providedIn: 'root',
})
export class PhoneAuthService {
  private recaptchaVerifier: RecaptchaVerifier | null = null;
  private confirmationResult: ConfirmationResult | null = null;

  constructor(private auth: Auth) {
    console.log('🔥 PhoneAuthService initialized');
  }

  /**
   * Inicializa el reCAPTCHA invisible
   * @param containerId ID del div donde se montará el reCAPTCHA (usar 'recaptcha-container')
   */
  initializeRecaptcha(containerId: string = 'recaptcha-container'): void {
    try {
      // Limpiar reCAPTCHA anterior si existe
      if (this.recaptchaVerifier) {
        this.recaptchaVerifier.clear();
      }

      // Crear nuevo reCAPTCHA invisible
      this.recaptchaVerifier = new RecaptchaVerifier(this.auth, containerId, {
        size: 'invisible',
        callback: (response: any) => {
          console.log('✅ reCAPTCHA resuelto:', response);
        },
        'expired-callback': () => {
          console.warn('⚠️ reCAPTCHA expirado, reiniciando...');
          this.recaptchaVerifier?.clear();
          this.recaptchaVerifier = null;
        },
      });

      console.log('✅ reCAPTCHA inicializado');
    } catch (error) {
      console.error('❌ Error al inicializar reCAPTCHA:', error);
      throw error;
    }
  }

  /**
   * Envía el código OTP al número de teléfono
   * @param phoneNumber Número en formato E.164 (ej: +51987654321)
   * @returns Observable con el resultado
   */
  sendOTP(phoneNumber: string): Observable<PhoneAuthResponse> {
    console.log('📱 Enviando OTP a:', phoneNumber);

    if (!this.recaptchaVerifier) {
      console.error('❌ reCAPTCHA no inicializado');
      return throwError(() => ({
        success: false,
        message:
          'reCAPTCHA no inicializado. Llama a initializeRecaptcha() primero.',
      }));
    }

    // Validar formato E.164
    if (!this.validatePhoneFormat(phoneNumber)) {
      return throwError(() => ({
        success: false,
        message:
          'Formato de teléfono inválido. Usa formato E.164 (ej: +51987654321)',
      }));
    }

    return from(
      signInWithPhoneNumber(this.auth, phoneNumber, this.recaptchaVerifier)
    ).pipe(
      map((confirmationResult: ConfirmationResult) => {
        this.confirmationResult = confirmationResult;
        console.log(
          '✅ OTP enviado correctamente. VerificationId:',
          confirmationResult.verificationId
        );
        return {
          success: true,
          message: 'Código OTP enviado correctamente',
          verificationId: confirmationResult.verificationId,
        };
      }),
      catchError((error: any) => {
        console.error('❌ Error al enviar OTP:', error);
        let message = 'Error al enviar el código OTP';

        // Mensajes de error específicos
        switch (error.code) {
          case 'auth/invalid-phone-number':
            message = 'Número de teléfono inválido';
            break;
          case 'auth/missing-phone-number':
            message = 'Debes proporcionar un número de teléfono';
            break;
          case 'auth/quota-exceeded':
            message = 'Has superado el límite de SMS. Intenta más tarde.';
            break;
          case 'auth/too-many-requests':
            message = 'Demasiados intentos. Por favor espera unos minutos.';
            break;
          case 'auth/captcha-check-failed':
            message = 'Verificación de seguridad fallida. Recarga la página.';
            break;
          case 'auth/network-request-failed':
            message = 'Error de conexión. Verifica tu internet.';
            break;
        }

        return throwError(() => ({
          success: false,
          message,
          error,
        }));
      })
    );
  }

  /**
   * Verifica el código OTP ingresado por el usuario
   * @param otpCode Código de 6 dígitos
   * @returns Observable con el token de Firebase
   */
  verifyOTP(otpCode: string): Observable<PhoneAuthResponse> {
    console.log('🔐 Verificando código OTP:', otpCode);

    if (!this.confirmationResult) {
      console.error('❌ No hay confirmación pendiente');
      return throwError(() => ({
        success: false,
        message: 'No hay verificación pendiente. Solicita un nuevo código.',
      }));
    }

    // Validar formato del código (6 dígitos)
    if (!/^\d{6}$/.test(otpCode)) {
      return throwError(() => ({
        success: false,
        message: 'El código debe tener 6 dígitos numéricos',
      }));
    }

    return from(this.confirmationResult.confirm(otpCode)).pipe(
      switchMap((userCredential) => {
        console.log('✅ Código OTP verificado. UID:', userCredential.user.uid);

        // Obtener el ID token de Firebase y convertirlo a Observable
        return from(userCredential.user.getIdToken());
      }),
      map((firebaseToken) => {
        console.log('🎟️ Firebase token obtenido');

        // Limpiar confirmación
        this.confirmationResult = null;

        return {
          success: true,
          message: 'Código verificado correctamente',
          firebaseToken,
        } as PhoneAuthResponse;
      }),
      catchError((error: any) => {
        console.error('❌ Error al verificar OTP:', error);
        let message = 'Código incorrecto o expirado';

        switch (error.code) {
          case 'auth/invalid-verification-code':
            message = 'Código incorrecto. Verifica e intenta nuevamente.';
            break;
          case 'auth/code-expired':
            message = 'El código ha expirado. Solicita uno nuevo.';
            break;
          case 'auth/session-expired':
            message = 'La sesión ha expirado. Solicita un nuevo código.';
            break;
          case 'auth/missing-verification-code':
            message = 'Debes ingresar el código de verificación';
            break;
        }

        return throwError(() => ({
          success: false,
          message,
          error,
        }));
      })
    );
  }

  /**
   * Valida el formato E.164 del número de teléfono
   * @param phone Número de teléfono
   * @returns true si el formato es válido
   */
  validatePhoneFormat(phone: string): boolean {
    // Formato E.164: +[código país][número] (ej: +51987654321)
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phone);
  }

  /**
   * Limpia el reCAPTCHA y la confirmación
   */
  cleanup(): void {
    console.log('🧹 Limpiando PhoneAuthService...');

    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
      this.recaptchaVerifier = null;
    }

    this.confirmationResult = null;
  }

  /**
   * Reenvía el código OTP (mismo que sendOTP pero limpia el estado previo)
   * @param phoneNumber Número en formato E.164
   */
  resendOTP(phoneNumber: string): Observable<PhoneAuthResponse> {
    console.log('🔄 Reenviando código OTP...');

    // Limpiar confirmación anterior
    this.confirmationResult = null;

    // Enviar nuevo código
    return this.sendOTP(phoneNumber);
  }

  /**
   * Obtiene el número de teléfono del usuario autenticado actualmente
   */
  getCurrentPhoneNumber(): string | null {
    const user = this.auth.currentUser;
    return user?.phoneNumber || null;
  }

  /**
   * Cierra sesión de Firebase (solo si se autenticó con phone)
   */
  signOut(): Observable<void> {
    console.log('👋 Cerrando sesión de Firebase...');
    return from(this.auth.signOut()).pipe(
      map(() => {
        console.log('✅ Sesión de Firebase cerrada');
      }),
      catchError((error) => {
        console.error('❌ Error al cerrar sesión:', error);
        return throwError(() => error);
      })
    );
  }
}
