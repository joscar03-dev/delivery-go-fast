export const environment = {
  production: true,
  // Ajusta esta URL para tu entorno de producción (sin slash final)
  apiUrl: 'https://api.gofastdelivery.site',

  // Firebase configuration
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
  recaptchaSiteKey: '6LcKFxIsAAAAALSzaPpsdCNsXDqTwKCXYV1IHpnY',
};
