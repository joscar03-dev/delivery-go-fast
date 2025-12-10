// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  // URL base del API del backend NestJS https://api.gofastdelivery.site
  // Para Android Emulator: usa 10.0.2.2 (mapea a localhost de tu PC)
  // Para dispositivo físico: usa la IP de tu PC en la red local (ej: 192.168.1.X)
  // Para web/navegador: usa localhost
  apiUrl: 'http://localhost:3000',

  // Firebase configuration
  // IMPORTANTE: Estos valores son de la configuración WEB de Firebase, NO del service account
  // Obtén estos valores de: Firebase Console > Project Settings > General > Your apps > Web app
  firebase: {
    apiKey: 'AIzaSyBVtu1KlEiA8HxPCoT9pSUIE3Pm2oBE2xA', // TODO: Reemplazar con tu API Key real
    authDomain: 'delivery-go-fast.firebaseapp.com',
    projectId: 'delivery-go-fast',
    storageBucket: 'delivery-go-fast.firebasestorage.app',
    messagingSenderId: '336750932075', // TODO: Reemplazar con tu Sender ID real
    appId: '1:336750932075:web:aa684cf0bf7ef97ec2012e', // TODO: Reemplazar con tu App ID real
    measurementId: 'G-D57Y0RRB4J',
  },

  // 🆕 reCAPTCHA Site Key para App Check (Web/PWA)
  // Obtén esta clave de: Firebase Console > App Check > Apps > Web app > reCAPTCHA provider
  // NOTA: Esta es la CLAVE PÚBLICA, es seguro incluirla en el código
  recaptchaSiteKey: '6LcKFxIsAAAAALSzaPpsdCNsXDqTwKCXYV1IHpnY',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
