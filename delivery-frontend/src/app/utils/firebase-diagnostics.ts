/**
 * 🔍 Utilidad de diagnóstico para Firebase Authentication
 *
 * Ayuda a identificar problemas de configuración con Firebase Phone Auth
 */

import { Auth } from '@angular/fire/auth';
import { environment } from '../../environments/environment';

export class FirebaseDiagnostics {
  static async runDiagnostics(auth: Auth): Promise<void> {
    console.log('🔍 === FIREBASE DIAGNOSTICS ===');
    console.log('');

    // 1. Verificar configuración de environment
    console.log('📋 1. Environment Configuration:');
    console.log(
      '  ✓ API Key:',
      environment.firebase.apiKey.substring(0, 20) + '...'
    );
    console.log('  ✓ Auth Domain:', environment.firebase.authDomain);
    console.log('  ✓ Project ID:', environment.firebase.projectId);
    console.log('  ✓ Storage Bucket:', environment.firebase.storageBucket);
    console.log('  ✓ App ID:', environment.firebase.appId);
    console.log('');

    // 2. Verificar instancia de Auth
    console.log('📋 2. Firebase Auth Instance:');
    console.log('  ✓ Auth initialized:', auth ? 'YES' : 'NO');
    if (auth) {
      console.log('  ✓ Auth app name:', auth.app.name);
      console.log('  ✓ Auth options:', {
        apiKey: auth.app.options.apiKey?.substring(0, 20) + '...',
        authDomain: auth.app.options.authDomain,
        projectId: auth.app.options.projectId,
      });
    }
    console.log('');

    // 3. Verificar URL actual
    console.log('📋 3. Current URL:');
    console.log('  ✓ Origin:', window.location.origin);
    console.log('  ✓ Hostname:', window.location.hostname);
    console.log('  ✓ Protocol:', window.location.protocol);
    console.log('  ✓ Port:', window.location.port);
    console.log('');

    // 4. Verificar si el dominio es válido para Firebase
    console.log('📋 4. Domain Validation:');
    const validDomains = ['localhost', '127.0.0.1', 'firebaseapp.com'];
    const isValidDomain = validDomains.some((domain) =>
      window.location.hostname.includes(domain)
    );
    console.log('  ✓ Is valid Firebase domain:', isValidDomain ? 'YES' : 'NO');
    if (!isValidDomain) {
      console.warn(
        '  ⚠️ WARNING: Current domain may not be authorized in Firebase Console'
      );
      console.warn(
        '  ⚠️ Add',
        window.location.hostname,
        'to Authorized domains'
      );
    }
    console.log('');

    // 5. Verificar reCAPTCHA container
    console.log('📋 5. reCAPTCHA Container:');
    const recaptchaContainer = document.getElementById('recaptcha-container');
    console.log('  ✓ Container exists:', recaptchaContainer ? 'YES' : 'NO');
    if (recaptchaContainer) {
      console.log(
        '  ✓ Container visible:',
        recaptchaContainer.offsetParent !== null
      );
    } else {
      console.error('  ❌ ERROR: #recaptcha-container not found in DOM');
      console.error(
        '  ❌ Add <div id="recaptcha-container"></div> to your component HTML'
      );
    }
    console.log('');

    // 6. Verificar acceso a Firebase APIs
    console.log('📋 6. Firebase API Connectivity:');
    try {
      const testUrl = `https://identitytoolkit.googleapis.com/v1/projects?key=${environment.firebase.apiKey}`;
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('  ✓ Identity Toolkit API status:', response.status);

      if (response.status === 200) {
        console.log('  ✅ API Key is valid and has access to Identity Toolkit');
      } else if (response.status === 403) {
        console.error(
          '  ❌ API Key is restricted. Remove restrictions in Google Cloud Console'
        );
        console.error(
          '  ❌ Go to: https://console.cloud.google.com/apis/credentials'
        );
      } else if (response.status === 400) {
        console.warn('  ⚠️ API Key may be valid but endpoint returned 400');
      } else {
        console.error('  ❌ Unexpected status:', response.status);
      }
    } catch (error) {
      console.error('  ❌ Failed to connect to Firebase API:', error);
    }
    console.log('');

    // 7. Recomendaciones
    console.log('📋 7. Recommendations:');
    console.log(
      '  1. Verify "Authorized domains" includes:',
      window.location.hostname
    );
    console.log(
      '     URL: https://console.firebase.google.com/project/' +
        environment.firebase.projectId +
        '/authentication/settings'
    );
    console.log('');
    console.log('  2. Verify API Key has no restrictions (for development)');
    console.log(
      '     URL: https://console.cloud.google.com/apis/credentials?project=' +
        environment.firebase.projectId
    );
    console.log('');
    console.log('  3. Verify Identity Toolkit API is enabled');
    console.log(
      '     URL: https://console.cloud.google.com/apis/library/identitytoolkit.googleapis.com?project=' +
        environment.firebase.projectId
    );
    console.log('');
    console.log('  4. Verify reCAPTCHA domains are configured');
    console.log(
      '     URL: https://console.cloud.google.com/security/recaptcha?project=' +
        environment.firebase.projectId
    );
    console.log('');

    console.log('🔍 === END DIAGNOSTICS ===');
  }

  /**
   * Verifica si la configuración básica está completa
   */
  static validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Verificar environment.firebase
    if (!environment.firebase.apiKey) {
      errors.push('Missing apiKey in environment.firebase');
    }
    if (!environment.firebase.authDomain) {
      errors.push('Missing authDomain in environment.firebase');
    }
    if (!environment.firebase.projectId) {
      errors.push('Missing projectId in environment.firebase');
    }
    if (!environment.firebase.appId) {
      errors.push('Missing appId in environment.firebase');
    }

    // Verificar container reCAPTCHA
    const recaptchaContainer = document.getElementById('recaptcha-container');
    if (!recaptchaContainer) {
      errors.push('Missing #recaptcha-container element in DOM');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Muestra un resumen rápido de la configuración
   */
  static quickCheck(auth: Auth): void {
    console.log('🔥 Firebase Quick Check:');
    console.log('  Auth:', auth ? '✅' : '❌');
    console.log('  API Key:', environment.firebase.apiKey ? '✅' : '❌');
    console.log('  Domain:', window.location.hostname);
    console.log(
      '  reCAPTCHA Container:',
      document.getElementById('recaptcha-container') ? '✅' : '❌'
    );
  }
}
