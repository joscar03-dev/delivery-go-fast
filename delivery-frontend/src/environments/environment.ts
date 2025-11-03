// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: true,
  // URL base del API del backend NestJS https://api.gofastdelivery.site
  // Para Android Emulator: usa 10.0.2.2 (mapea a localhost de tu PC)
  // Para dispositivo físico: usa la IP de tu PC en la red local (ej: 192.168.1.X)
  // Para web/navegador: usa localhost
  apiUrl: 'https://api.gofastdelivery.site',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
