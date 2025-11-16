import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.deliverygofast1.app',
  appName: 'Delivery Go Fast',
  webDir: 'www',
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['phone'],
    },
  },
};

export default config;
