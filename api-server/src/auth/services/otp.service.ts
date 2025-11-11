import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';

/**
 * Servicio para verificar códigos OTP usando Firebase Admin SDK
 *
 * IMPORTANTE: Este servicio NO envía códigos OTP.
 * El envío de OTP se hace desde el FRONTEND usando Firebase Phone Auth.
 * Este servicio solo VERIFICA que el token de Firebase sea válido.
 *
 * Flujo:
 * 1. Frontend: Usuario ingresa teléfono → Firebase envía SMS con código
 * 2. Frontend: Usuario ingresa código → Firebase retorna idToken
 * 3. Frontend: Envía idToken al backend
 * 4. Backend: Este servicio verifica el idToken con Firebase Admin SDK
 */
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly auth: admin.auth.Auth;

  constructor() {
    try {
      // Verificar si ya existe una app de Firebase inicializada
      if (admin.apps.length === 0) {
        this.logger.log('🔥 Inicializando Firebase Admin SDK...');

        // Ruta al archivo de credenciales (desde la raíz del proyecto)
        const serviceAccountPath = path.join(
          process.cwd(),
          'firebase-service-account.json',
        );

        this.logger.log(`📄 Usando credenciales de: ${serviceAccountPath}`);

        // Inicializar Firebase Admin con el archivo JSON
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountPath),
        });

        this.logger.log('✅ Firebase Admin SDK inicializado correctamente');
        this.logger.log(`📱 Project ID: ${admin.app().options.projectId}`);
      } else {
        this.logger.log('✅ Firebase Admin SDK ya estaba inicializado');
      }

      this.auth = admin.auth();
    } catch (error) {
      this.logger.error('❌ Error al inicializar Firebase Admin SDK:', error);
      this.logger.error(
        '💡 Verifica que exista: api-server/firebase-service-account.json',
      );
      throw error;
    }
  }

  /**
   * Verifica el token ID de Firebase generado en el frontend
   * después de que el usuario completó el flujo de OTP
   *
   * @param idToken - Token ID de Firebase generado después de verificar OTP
   * @returns Información decodificada del token
   * @throws UnauthorizedException si el token es inválido o expirado
   */
  async verifyFirebaseToken(
    idToken: string,
  ): Promise<admin.auth.DecodedIdToken> {
    try {
      this.logger.log('🔍 Verificando token de Firebase...');

      const decodedToken = await this.auth.verifyIdToken(idToken);

      this.logger.log(
        `✅ Token verificado exitosamente para UID: ${decodedToken.uid}`,
      );
      this.logger.debug('📊 Información del token:', {
        uid: decodedToken.uid,
        phone: decodedToken.phone_number,
        firebase: {
          identities: decodedToken.firebase?.identities,
          sign_in_provider: decodedToken.firebase?.sign_in_provider,
        },
      });

      return decodedToken;
    } catch (error) {
      this.logger.error('❌ Error al verificar token de Firebase:', error);

      if (error.code === 'auth/id-token-expired') {
        throw new UnauthorizedException(
          'El token de autenticación ha expirado. Por favor, solicita un nuevo código.',
        );
      } else if (error.code === 'auth/id-token-revoked') {
        throw new UnauthorizedException(
          'El token de autenticación fue revocado.',
        );
      } else if (error.code === 'auth/argument-error') {
        throw new UnauthorizedException('Token de autenticación inválido.');
      }

      throw new UnauthorizedException(
        'No se pudo verificar el token de autenticación',
      );
    }
  }

  /**
   * Verifica que el número de teléfono del token coincida con el esperado
   *
   * @param idToken - Token ID de Firebase
   * @param expectedPhone - Número de teléfono esperado en formato E.164
   * @returns true si el teléfono coincide
   * @throws UnauthorizedException si el teléfono no coincide
   */
  async verifyPhoneNumber(
    idToken: string,
    expectedPhone: string,
  ): Promise<boolean> {
    const decodedToken = await this.verifyFirebaseToken(idToken);

    // Firebase almacena el teléfono con el código de país
    const tokenPhone = decodedToken.phone_number;

    if (!tokenPhone) {
      this.logger.error('❌ El token no contiene un número de teléfono');
      throw new UnauthorizedException(
        'El token no contiene información del teléfono',
      );
    }

    // Normalizar ambos números (eliminar espacios, guiones, etc.)
    const normalizedTokenPhone = tokenPhone.replace(/[\s-]/g, '');
    const normalizedExpectedPhone = expectedPhone.replace(/[\s-]/g, '');

    if (normalizedTokenPhone !== normalizedExpectedPhone) {
      this.logger.error(
        `❌ El teléfono no coincide. Token: ${normalizedTokenPhone}, Esperado: ${normalizedExpectedPhone}`,
      );
      throw new UnauthorizedException(
        'El número de teléfono no coincide con el token de verificación',
      );
    }

    this.logger.log(`✅ Teléfono verificado correctamente: ${expectedPhone}`);
    return true;
  }

  /**
   * Obtiene información del usuario de Firebase por UID
   *
   * @param uid - UID del usuario en Firebase
   * @returns Información del usuario de Firebase
   */
  async getUserByUid(uid: string): Promise<admin.auth.UserRecord> {
    try {
      return await this.auth.getUser(uid);
    } catch (error) {
      this.logger.error(
        `❌ Error al obtener usuario ${uid} de Firebase:`,
        error,
      );
      throw new UnauthorizedException(
        'No se pudo obtener la información del usuario',
      );
    }
  }

  /**
   * Obtiene información del usuario de Firebase por número de teléfono
   *
   * @param phoneNumber - Número de teléfono en formato E.164
   * @returns Información del usuario de Firebase
   */
  async getUserByPhone(phoneNumber: string): Promise<admin.auth.UserRecord> {
    try {
      return await this.auth.getUserByPhoneNumber(phoneNumber);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        throw new UnauthorizedException(
          'No se encontró un usuario con este número de teléfono',
        );
      }
      this.logger.error(
        `❌ Error al obtener usuario por teléfono ${phoneNumber}:`,
        error,
      );
      throw new UnauthorizedException(
        'No se pudo obtener la información del usuario',
      );
    }
  }

  /**
   * Verifica que el token corresponda a un método de autenticación de teléfono
   *
   * @param idToken - Token ID de Firebase
   * @returns true si es autenticación por teléfono
   */
  async isPhoneAuthentication(idToken: string): Promise<boolean> {
    const decodedToken = await this.verifyFirebaseToken(idToken);

    // Firebase marca el sign_in_provider como 'phone' para autenticación por teléfono
    const signInProvider = decodedToken.firebase?.sign_in_provider;

    if (signInProvider !== 'phone') {
      this.logger.warn(
        `⚠️ El token no es de autenticación por teléfono. Provider: ${signInProvider}`,
      );
      return false;
    }

    return true;
  }

  /**
   * Valida el formato E.164 del número de teléfono
   *
   * @param phone - Número de teléfono a validar
   * @returns true si el formato es válido
   */
  validatePhoneFormat(phone: string): boolean {
    // Formato E.164: +[código de país][número]
    // Ejemplos: +51987654321, +14155552671
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phone);
  }

  /**
   * Extrae el código de país del número de teléfono
   *
   * @param phone - Número de teléfono en formato E.164
   * @returns Código de país (ej: '+51', '+1')
   */
  extractCountryCode(phone: string): string | null {
    if (!this.validatePhoneFormat(phone)) {
      return null;
    }

    // Extraer los primeros 2-3 dígitos después del '+'
    const match = phone.match(/^\+(\d{1,3})/);
    return match ? `+${match[1]}` : null;
  }
}
