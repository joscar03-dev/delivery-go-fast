import { bootstrapApplication } from '@angular/platform-browser';
import {
  RouteReuseStrategy,
  provideRouter,
  withPreloading,
  PreloadAllModules,
} from '@angular/router';
import {
  IonicRouteStrategy,
  provideIonicAngular,
} from '@ionic/angular/standalone';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './app/interceptors/auth.interceptor';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { environment } from './environments/environment';

// 🆕 IMPORTS DE APP CHECK
import {
  initializeAppCheck,
  provideAppCheck,
  ReCaptchaV3Provider,
} from '@angular/fire/app-check';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

// 🆕 Configurar token de debug para desarrollo (solo en localhost)
// Esto evita que App Check bloquee tus pruebas en desarrollo
declare global {
  // eslint-disable-next-line no-var
  var FIREBASE_APPCHECK_DEBUG_TOKEN: boolean | string;
}

if (!environment.production) {
  // En desarrollo, usar token de debug
  // Puedes obtener el token real desde Firebase Console si lo necesitas
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  console.log('🐛 App Check Debug Mode: ENABLED');
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptors([authInterceptor])),

    // 🔥 Firebase Core
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),

    // 🆕 APP CHECK - Protege contra abuso de APIs (SMS, etc)
    provideAppCheck(() => {
      const app = initializeApp(environment.firebase);

      // Crear proveedor reCAPTCHA v3 para Web/PWA
      const provider = new ReCaptchaV3Provider(environment.recaptchaSiteKey);

      // Inicializar App Check con auto-refresh de tokens
      return initializeAppCheck(app, {
        provider: provider,
        isTokenAutoRefreshEnabled: true,
      });
    }),
  ],
});
