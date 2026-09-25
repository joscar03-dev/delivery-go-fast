/**
 * Orígenes permitidos por CORS.
 *
 * Vive aqui y no en main.ts para que el gateway de Socket.IO use la misma
 * lista. Con dos copias, una acaba divergiendo y el síntoma es que el socket
 * deja de conectar en producción sin que ningún test lo note.
 */
export const ALLOWED_ORIGINS = [
  'http://localhost:8100', // Desarrollo web
  'http://localhost:4200', // Desarrollo Angular
  'http://localhost:8101', // Desarrollo web alternativo
  'http://10.0.2.2:8100', // Android emulator
  'capacitor://localhost', // Capacitor iOS
  'ionic://localhost', // Ionic iOS
  'https://localhost', // General
  'https://gofastdelivery.site', // Producción web
  'https://www.gofastdelivery.site', // Producción web (www)
  'https://api.gofastdelivery.site', // Producción API
];
