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
  ReCaptchaEnterpriseProvider,
} from '@angular/fire/app-check';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

// 🆕 Token de depuración de App Check para desarrollo (solo localhost)
// Asignado ANTES de inicializar Firebase/App Check para evitar que el SDK
// genere uno nuevo en cada recarga y desincronice el registrado en consola.
declare global {
  // eslint-disable-next-line no-var
  var FIREBASE_APPCHECK_DEBUG_TOKEN: string | undefined;
}

if (
  !environment.production &&
  typeof window !== 'undefined' &&
  window.location.hostname === 'localhost'
) {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN =
    'af81080a-379a-411e-bfc3-190fa289c90a';
  console.log(
    '🐛 Debug Token App Check fijado (activo solo si App Check está habilitado)'
  );
}

// 🔍 Interceptor de red (solo dev): loguea el body CRUDO de las respuestas
// de Firebase (identitytoolkit / firebaseappcheck). El SDK de Auth esconde
// el body del HTTP 400 (auth/invalid-app-credential), aquí lo vemos real.
if (!environment.production && typeof window !== 'undefined') {
  const originalFetch = window.fetch ? window.fetch.bind(window) : null;
  if (originalFetch) {
    // eslint-disable-next-line no-restricted-globals
    (window as any).fetch = async (input: any, init?: any) => {
      let url = '';
      try {
        url = typeof input === 'string' ? input : input?.url ?? '';
      } catch {
        url = '';
      }
      const res = await originalFetch(input, init);
      try {
        if (
          url.includes('identitytoolkit.googleapis.com') ||
          url.includes('firebaseappcheck.googleapis.com') ||
          url.includes('googleapis.com/identitytoolkit')
        ) {
          const clone = res.clone();
          const body = await clone.text();
          if (res.ok) {
            console.log(
              '📡 RESP OK',
              res.status,
              url.replace(/key=.*/, 'key=***'),
              body.slice(0, 2000)
            );
          } else {
            console.error(
              '🔥 RESP ERROR',
              res.status,
              url.replace(/key=.*/, 'key=***'),
              body.slice(0, 4000)
            );
          }
        }
      } catch {
        // ignorar errores de lectura del body (solo diagnostico)
      }
      return res;
    };
    console.log('🔍 Interceptor de red de Firebase activo (dev)');
  }
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

    // 🆕 APP CHECK - El proyecto espera reCAPTCHA Enterprise, y el path moderno
    // de Firebase Auth usa el token de App Check (Enterprise) EN VEZ de
    // reCAPTCHA v2 para el envío de SMS. Por eso App Check DEBE estar activo
    // también en dev (el debug token registrado lo hace funcionar en localhost).
    provideAppCheck(() => {
      const app = initializeApp(environment.firebase);

      // Crear proveedor reCAPTCHA Enterprise para Web/PWA
      const provider = new ReCaptchaEnterpriseProvider(
        environment.recaptchaSiteKey
      );

      // Inicializar App Check con auto-refresh de tokens
      return initializeAppCheck(app, {
        provider: provider,
        isTokenAutoRefreshEnabled: true,
      });
    }),
  ],
});
