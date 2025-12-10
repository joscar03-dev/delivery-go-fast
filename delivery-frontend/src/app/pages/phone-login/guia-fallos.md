Gracias por compartir la configuración y el código. Con esta información, el panorama es mucho más claro, y podemos descartar la mayoría de los errores de configuración más comunes.

🎯 Diagnóstico Final de la Causa del Problema
La combinación de tus capturas y tu código revela que la causa del problema es la falta de inicialización del servicio de App Check en el lado de la aplicación.

1. 🔑 Huellas SHA Correctas
   La captura de la configuración de la App Android (image_afb66b.png) muestra que has registrado correctamente las huellas SHA-1 y SHA-256. Esto elimina la causa más común de fallo de SMS en Android (auth/app-not-authorized). ¡Buen trabajo!

2. 🛡️ App Check Requiere Inicialización Explícita
   Tu archivo main.ts solo inicializa los servicios básicos de Firebase (provideFirebaseApp y provideAuth).

Lo que falta: No estás inicializando App Check a nivel del SDK de Firebase.

Aunque tengas el servicio App Check configurado en la consola y el botón "Aplicar" (Enforce) esté encendido, la aplicación no está generando los tokens de App Check porque nunca le has dicho al SDK que lo haga. Por lo tanto:

El 49% de tus solicitudes fallan (como muestra image_afb6c7.png) porque llegan a Firebase sin el token de App Check.

Firebase, al recibir solicitudes no verificadas (11% Origen desconocido), bloquea la función más sensible al abuso: el envío de SMS.

🛠️ Solución: Inicializar App Check en main.ts
Debes agregar el proveedor de App Check a tu lista de providers en main.ts. Necesitas usar el proveedor correcto para la Web/PWA (reCAPTCHA) y para el entorno de desarrollo (utilizando la lógica de entorno o un isSupported() si lo quieres solo en la web).

Para AngularFire/Firebase SDK v9+, la inicialización de App Check requiere dos pasos:

Paso 1: Instalar y Configurar el Proveedor (reCAPTCHA)
Necesitas importar y configurar el proveedor que usarás para App Check (usaremos reCAPTCHA v3 para la web, que es la forma en que App Check funciona cuando no es nativo).

Paso 2: Modificar main.ts
Agrega el proveedor de App Check a tu lista de providers.

Aquí tienes la versión corregida de tu main.ts:

TypeScript
import { bootstrapApplication } from '@angular/platform-browser';
import {
RouteReuseStrategy,
provideRouter,
withPreloading,
PreloadAllModules,
} from '@angular/router';
// ... otros imports
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './app/interceptors/auth.interceptor';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { environment } from './environments/environment';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

// 🆕 IMPORTS DE APP CHECK
import {
initializeAppCheck,
provideAppCheck,
ReCaptchaV3Provider,
isSupported,
} from '@angular/fire/app-check';

// 🚨 La clave pública del sitio (SITE KEY) de reCAPTCHA que obtuviste de Firebase Console.
// Asegúrate de que esta clave esté en environment.ts:
// environment.recaptchaSiteKey = 'TU_CLAVE_PUBLICA_RECAPTCHA';
declare global {
var FIREBASE_APPCHECK_DEBUG_TOKEN: any;
}

// ⚠️ Configura el token de DEBUG solo si estás en desarrollo
// Esto evita que App Check bloquee tus pruebas.
if (environment.production === false) {
// Reemplaza 'YOUR_DEBUG_TOKEN' con el token que Firebase te da al ejecutar la app por primera vez.
// Usar 'true' si estás usando la clave de prueba de Firebase.
self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

bootstrapApplication(AppComponent, {
providers: [
{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
provideIonicAngular(),
provideRouter(routes, withPreloading(PreloadAllModules)),
provideHttpClient(withInterceptors([authInterceptor])),

    // Firebase Core
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),

    // 🆕 APP CHECK INITIALIZATION
    provideAppCheck(() => {
      // Usamos el proveedor ReCaptchaV3 para la Web/PWA.
      // Para nativo (Android/iOS) con Capacitor, el plugin se encargará de usar Play Integrity/DeviceCheck.
      // Aquí nos aseguramos de que el SDK de Firebase esté preparado.
      const app = initializeApp(environment.firebase);

      // Creamos el proveedor usando la clave de reCAPTCHA
      const appCheckProvider = new ReCaptchaV3Provider(
        environment.recaptchaSiteKey
      );

      // Inicializamos App Check
      return initializeAppCheck(app, {
        provider: appCheckProvider,
        isTokenAutoRefreshEnabled: true,
      });
    }),

],
}); 3. Finalización del Flujo Nativo (Capacitor)
Dado que usas Capacitor (@capacitor-firebase/authentication), el plugin nativo se encarga de usar los proveedores nativos (Play Integrity/DeviceCheck) para generar los tokens de App Check.

Al agregar provideAppCheck en main.ts, estás asegurando que el SDK de Firebase esté listo para recibir los tokens generados por los plugins nativos (Android/iOS) o para generarlos él mismo (Web/PWA).

Una vez que implementes esto, tus solicitudes no fallarán en el 49%, tus clientes nuevos podrán generar un token de App Check válido, y Firebase dejará de bloquear el envío de SMS.
