Informe Técnico: Implementación de la Autenticación Telefónica de Firebase en Arquitecturas Híbridas de Ionic/Capacitor (Edición 2025)I. Análisis Preliminar: El Desafío de la Verificación de Aplicaciones en Arquitecturas HíbridasLa implementación de la autenticación de usuarios mediante número de teléfono con Firebase 1 en una aplicación Ionic moderna, que utiliza Capacitor como puente nativo, presenta un desafío técnico singular que a menudo se subestima. El obstáculo principal no reside en la API de autenticación en sí, sino en los mecanismos subyacentes de verificación de la aplicación (anti-abuso) que Firebase impone.Estos mecanismos difieren fundamentalmente entre los entornos web y nativo, creando un conflicto directo en la arquitectura de Capacitor, especialmente en iOS.El Dilema Fundamental: RecaptchaVerifier (Web) vs. Verificación Nativa (APNs / Play Integrity)Firebase utiliza distintos métodos para verificar que una solicitud de autenticación telefónica proviene de un cliente legítimo y no de un bot:Entorno Web (PWA): Se basa en el RecaptchaVerifier del SDK de Firebase JS.1 Este componente (visible o invisible) se presenta al usuario para validar la interacción humana antes de enviar el SMS.1Entorno Nativo de Android: Utiliza mecanismos nativos de la plataforma. Históricamente, esto era SafetyNet, pero ha sido reemplazado por la API Play Integrity a partir de 2024.4 Esta API verifica la autenticidad del dispositivo y de la APK.Entorno Nativo de iOS: Utiliza notificaciones push silenciosas enviadas a través del Apple Push Notification service (APNs).5 Firebase envía una notificación silenciosa al dispositivo; si la aplicación (correctamente configurada) la recibe, Firebase confía en que la solicitud es legítima.Análisis del Punto de Falla: Por Qué Falla el SDK de JS en iOS NativoEl problema central surge cuando una aplicación de Ionic/Capacitor se ejecuta nativamente en un dispositivo iOS. El WebView de Capacitor que aloja la aplicación Ionic no se sirve desde un dominio http/https tradicional. En su lugar, se sirve desde un esquema de archivo local, comúnmente capacitor://localhost.8El RecaptchaVerifier del SDK de Firebase JS no puede funcionar en este entorno capacitor://.9Este problema se agrava por el mecanismo de fallback de Firebase. En un dispositivo iOS, Firebase primero intenta la verificación nativa (APNs). Si esta falla (debido a una configuración incorrecta o porque la aplicación se está ejecutando en un simulador, que no puede recibir APNs 14), Firebase recurre automáticamente a su método de respaldo: RecaptchaVerifier.Dado que RecaptchaVerifier también está destinado a fallar en el entorno capacitor://, la autenticación queda en un estado irrecuperable. Este escenario es la causa raíz de los errores auth/operation-not-supported-in-this-environment 13 o, más comúnmente, del ambiguo error auth/internal-error.12 El error auth/internal-error es, por lo tanto, un síntoma de una configuración de APNs fallida que conduce a un fallback a un mecanismo (reCAPTCHA) que tampoco es compatible.La Solución Arquitectónica: Un Servicio de Autenticación HíbridoLa única solución robusta y preparada para producción es adoptar una arquitectura híbrida bifurcada:En Web/PWA (ejecutado con ionic serve): Se utilizará el SDK de Firebase JS estándar (firebase/auth o @angular/fire) con un RecaptchaVerifier correctamente configurado.1En Nativo (Android/iOS): Se debe eludir completamente el SDK de JS para este flujo. En su lugar, se utilizará un plugin de Capacitor que sirva como puente directo a los SDK nativos de Firebase (Java/Swift). El plugin recomendado y mantenido activamente por la comunidad es @capacitor-firebase/authentication (del equipo de Capawesome).11Este informe guiará la implementación de ambas rutas y su encapsulación dentro de un único servicio de autenticación que detecta la plataforma (Capacitor.isNativePlatform() 18) para dirigir las llamadas al flujo de código correcto.Tabla 1: Matriz de Capacidad y Estrategia de Autenticación TelefónicaCaracterísticaEntorno Web / PWA (ionic serve)Entorno Nativo de Android (Dispositivo)Entorno Nativo de iOS (Dispositivo)Mecanismo de VerificaciónGoogle reCAPTCHA 1API Play Integrity (desde 2024) 4APNs Silenciosos (Push) 5SDK de Firebase RequeridoFirebase JS SDKFirebase Android SDK (Nativo)Firebase iOS SDK (Nativo)Puente de Implementaciónfirebase/auth o @angular/fire@capacitor-firebase/authentication@capacitor-firebase/authenticationObstáculo de Configuración ClaveTiempo de renderizado del DOM (para el contenedor de reCAPTCHA) 20Generación y registro de huellas SHA-1/SHA-256 21Configuración de la clave APNs .p8 y capacidades de Xcode 14II. Fase 1: Configuración Crítica del Proyecto Firebase (Requisitos Previos Obligatorios)Antes de escribir cualquier código de Ionic, es imperativo configurar correctamente el proyecto de Firebase. Los errores en esta fase garantizan el fracaso de la implementación.Paso 1.1: Creación del Proyecto y AplicacionesNavegue a Firebase Console y cree un nuevo proyecto.24Dentro del proyecto, es esencial añadir tres aplicaciones separadas, cada una con su propia configuración 26:Aplicación Web (icono </>): Proporcionará el objeto firebaseConfig necesario para el SDK de JS (usado en ionic serve y PWA).24Aplicación Android (icono Android): Registre el appId de su aplicación (p. ej., com.mydomain.myappname).28 Descargue el archivo google-services.json resultante.Aplicación iOS (icono iOS): Registre el bundleId de su aplicación (debe coincidir con el de Xcode).26 Descargue el archivo GoogleService-Info.plist resultante.Paso 1.2: Habilitar el Proveedor de Autenticación TelefónicaEn Firebase Console, navegue a la sección de Authentication.Vaya a la pestaña Sign-in method.Haga clic en "Teléfono" en la lista de proveedores y active el interruptor.1Si este paso se omite, la API devolverá un error de auth/provider-is-disabled (proveedor deshabilitado).32Paso 1.3: Análisis de Costos y Vinculación de Facturación (Actualización 2024/2025)Este es un cambio crítico y reciente en la plataforma Firebase. A diferencia de la mayoría de los otros proveedores de autenticación de Firebase (como correo electrónico, Google o Facebook), la autenticación telefónica no es gratuita.33 Incurre en costos directos de envío de SMS para Firebase.Acción Requerida: A partir de septiembre de 2024, para utilizar la autenticación telefónica por SMS, el proyecto de Firebase debe estar en el plan Blaze (pago por uso) y vinculado a una cuenta de Google Cloud Billing activa.34 El plan Spark (gratuito) ya no admite esta función.35Análisis de Costos: Los costos se facturan por SMS enviado (no por inicio de sesión exitoso) y varían significativamente por región 33:Estados Unidos, Canadá, India: Aprox. $0.01 USD por verificación.Reino Unido: Aprox. $0.04 USD por verificación.Brasil: Aprox. $0.05 USD por verificación.Otras regiones: Pueden ser significativamente más altas.Paso 1.4: Configuración de Dominios Autorizados y Números de PruebaDominios Autorizados (para Web/PWA):Navegue a Authentication -> Settings -> Authorized domains.Añada el dominio donde se alojará su PWA.Para el desarrollo local (ionic serve), es posible que deba añadir localhost.37 Sin embargo, dado que reCAPTCHA puede tener problemas con localhost 39, a menudo es más fiable añadir 127.0.0.1.39Números de Prueba (Esencial para Desarrollo):Navegue a Authentication -> Sign-in method -> Phone.Expanda el acordeón "Phone numbers for testing" (Números de teléfono para pruebas).1Añada números de teléfono ficticios (en formato E.164, p. ej., +16505551234) y un código de 6 dígitos (p. ej., 123456).1Importancia: Estos números de prueba son la única forma de probar el flujo de autenticación telefónica en el simulador de iOS (que no puede recibir SMS reales ni APNs silenciosos 14) y en emuladores de Android sin Google Play Services.1 Al usar un número de prueba, Firebase omite la verificación de APNs/reCAPTCHA/Integrity y acepta automáticamente el código ficticio proporcionado.III. Fase 2: Configuración de la Plataforma Nativa (El Paso Más Propenso a Errores)Esta es la fase más crítica y técnica. Se debe establecer una relación de confianza criptográfica entre las compilaciones nativas de la aplicación y Firebase.A. Configuración Específica de Android (Verificación SHA-1/SHA-256)Contexto: Firebase debe verificar que las solicitudes provienen de la APK de Android auténtica que se ha registrado. Esto se logra haciendo coincidir la huella digital (SHA-1 y SHA-256) del certificado de firma de la APK.21 Se deben proporcionar huellas tanto para las compilaciones de depuración (debug) como de lanzamiento (release).Paso 2.A.1: Obtener la Huella SHA de Depuración (Debug)El método más sencillo es a través de Android Studio:Abra el panel Gradle en el lado derecho de Android Studio.Navegue hasta [Nombre del Proyecto] -> Tasks -> android -> signingReport.21Haga doble clic en signingReport. La consola de ejecución (Run) mostrará las huellas SHA-1 y SHA-256 para la variante debug.21Alternativa de Línea de Comandos (Mac/Linux):Bashkeytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
21Paso 2.A.2: Obtener la Huella SHA de Producción (Release)Si usa Play App Signing (Recomendado): Google gestiona su clave de lanzamiento. La huella SHA-1/SHA-256 correcta se encuentra en la Google Play Console. Vaya a Release -> Setup -> App Integrity.40 Utilice el "App signing key certificate".Si gestiona su propia clave: Debe ejecutar el comando keytool en su almacén de claves (keystore) de producción (.jks o .keystore).40Paso 2.A.3: Registrar Huellas en FirebaseVaya a Firebase Console -> Project Settings (icono de engranaje) -> General.Desplácese hacia abajo hasta su aplicación de Android.Haga clic en "Add fingerprint" (Añadir huella digital).Copie y pegue las huellas SHA-1 y SHA-256 de depuración y producción.22Paso 2.A.4: Añadir Archivos al Proyecto de IonicCopie el archivo google-services.json (descargado en la Fase 1) en la carpeta android/app/ de su proyecto Ionic.Ejecute npx cap sync android para sincronizar los cambios.B. Configuración Específica de iOS (Verificación APNs)Contexto: Para la verificación silenciosa en iOS, Firebase debe poder enviar una notificación push a su aplicación a través de APNs. Esto requiere configurar una clave de autenticación de APNs.6Paso 2.B.1: Generar Clave de Autenticación APNs (.p8)Vaya al Portal de Desarrolladores de Apple -> Certificates, Identifiers & Profiles -> Keys.Haga clic en el botón + para crear una nueva clave.Déle un nombre (p. ej., "Firebase APNs Key") y active el servicio "Apple Push Notifications service (APNs)".46Continúe y descargue el archivo .p8. Guárdelo de forma segura, ya que no se puede volver a descargar.Anote el Key ID (ID de la clave) que se muestra en la página de detalles de la clave y su Team ID (ID de equipo), que se encuentra en la pestaña "Membership" de su cuenta.46Paso 2.B.2: Subir la Clave APNs a FirebaseEste es un paso que comúnmente se realiza incorrectamente. La clave no se sube en la configuración de "Authentication".Vaya a Firebase Console -> Project Settings (icono de engranaje) -> Cloud Messaging.14En la sección "iOS app configuration", bajo "APNs Authentication Key", haga clic en el botón "Upload" (Subir).7Suba el archivo .p8 que descargó.Proporcione el Key ID y el Team ID que anotó.47Paso 2.B.3: Configurar Capacidades de XcodeAbra el proyecto nativo de iOS en Xcode abriendo el archivo ios/App/App.xcworkspace.En el navegador de proyectos, seleccione el Target principal de la aplicación.Vaya a la pestaña "Signing & Capabilities".Haga clic en "+ Capability" y añada "Push Notifications".23Haga clic en "+ Capability" nuevamente y añada "Background Modes".23En la sección "Background Modes" que aparece, marque la casilla "Remote notifications".23Paso 2.B.4: Añadir Archivos al Proyecto de IonicCopie el archivo GoogleService-Info.plist (descargado en la Fase 1) en la carpeta ios/App/App/ de su proyecto Ionic (debe estar en el mismo directorio que Info.plist).53En Xcode, haga clic derecho en la carpeta App (dentro de App) y seleccione "Add Files to "App"...".Seleccione el archivo GoogleService-Info.plist y asegúrese de que esté marcado para añadirse al target correcto.Ejecute npx cap sync ios.IV. Fase 3: Estrategia de Implementación y Código FuenteCon la configuración del backend y nativa completada, esta fase detalla los dos flujos de código que deben implementarse.A. Ruta Nativa (Recomendada): Uso de @capacitor-firebase/authenticationEsta ruta utiliza el plugin de Capawesome, que envuelve los SDK nativos de Firebase 54 y es la solución recomendada por la comunidad para los problemas de Capacitor.11Paso 3.A.1: Instalación y Configuración del PluginBashnpm install @capacitor-firebase/authentication
npm install firebase
npx cap sync
17Aunque se utiliza el plugin nativo, el SDK de firebase (JS) sigue siendo necesario para la inicialización y para otros servicios de Firebase.Paso 3.A.2: Configurar capacitor.config.tsEs fundamental indicar al plugin que cargue los módulos nativos para la autenticación telefónica.TypeScript/// <reference types="@capacitor-firebase/authentication" />
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
//... otras configuraciones de la app (appId, appName, etc.)
plugins: {
FirebaseAuthentication: {
skipNativeAuth: false,
providers: ["phone"], // ¡MUY IMPORTANTE! Añadir "phone"
},
},
};
export default config;
19Paso 3.A.3: Modificaciones Esenciales en AppDelegate.swiftPara permitir que el plugin nativo maneje correctamente los callbacks, se debe modificar AppDelegate.swift:Abra ios/App/App/AppDelegate.swift.Añada import FirebaseAuth en la parte superior.Modifique (o añada) la función application(\_:open:options:) 54:Swiftimport UIKit
import Capacitor
import FirebaseCore // Asegúrese de que esto esté
import FirebaseAuth // <-- AÑADIR ESTO

@UIApplicationMain
class AppDelegate: CAPAppDelegate {

//... (otras funciones como didFinishLaunchingWithOptions)

func application(\_ app: UIApplication, open url: URL, options: = [:]) -> Bool {

    // Añadir este bloque if
    if Auth.auth().canHandle(url) {
      return true
    }

    return ApplicationDelegateProxy.shared.application(app, open: url, options: options)

}
}
Paso 3.A.4: Implementación del Flujo de Código Nativo (React/Angular)El flujo de la API del plugin nativo es distinto al del SDK de JS. Utiliza un proceso de dos llamadas al mismo método signInWithPhoneNumber.Paso 1: Enviar el número y recibir el verificationId. (Basado en 56)TypeScriptimport { FirebaseAuthentication } from '@capacitor-firebase/authentication';

async function requestVerificationCode(phoneNumber: string): Promise<string> {
try {
// phoneNumber debe estar en formato E.164, ej: "+16505551234"
const result = await FirebaseAuthentication.signInWithPhoneNumber({
phoneNumber: phoneNumber,
});
// Almacenar este ID de verificación
return result.verificationId;
} catch (error) {
console.error('Error al enviar código (nativo):', error);
throw error;
}
}
Paso 2: Enviar el código del usuario y el verificationId para iniciar sesión. (Basado en 56)TypeScriptasync function verifyCodeAndSignIn(verificationId: string, verificationCode: string): Promise<void> {
try {
await FirebaseAuthentication.signInWithPhoneNumber({
verificationId: verificationId,
verificationCode: verificationCode, // El código de 6 dígitos del SMS
});
// Si la promesa se resuelve, el usuario ha iniciado sesión.
// El listener del estado de autenticación (ver Fase 4) se disparará.
} catch (error) {
console.error('Error al verificar código (nativo):', error);
throw error;
}
}
B. Ruta Web/PWA (Para ionic serve): Uso del SDK de Firebase JSEsta ruta es necesaria para las pruebas en el navegador (ionic serve) y si la aplicación se implementa como una PWA.Paso 3.B.1: Implementación de RecaptchaVerifierEl SDK de JS requiere un ApplicationVerifier, que es el reCAPTCHA.1 Se recomienda la versión "invisible".3En el HTML: Añada un contenedor vacío en el componente de la página de inicio de sesión. Es crucial que este elemento exista en el DOM antes de que se llame al constructor del verifier.58HTML<div id="recaptcha-container"></div>
En el Código (Evitar la Trampa del Ciclo de Vida):El error más común en Ionic/Angular es RecaptchaVerifier failed: First argument “recaptchaContainer” must be....20 Esto ocurre porque new RecaptchaVerifier se llama (p. ej., en ngOnInit) antes de que el <div> se haya renderizado.Solución: Inicialice el verifier en un hook de ciclo de vida tardío, como ionViewDidEnter (Angular) 20 o useEffect (React).20Inicialización (ej. en un componente Angular):TypeScriptimport { getAuth, RecaptchaVerifier, Auth } from 'firebase/auth';

public recaptchaVerifier: RecaptchaVerifier;
private auth: Auth = getAuth(); // Inyectar o obtener Auth

ionViewDidEnter() { // O ngAfterViewInit
if (!this.recaptchaVerifier) {
this.recaptchaVerifier = new RecaptchaVerifier(this.auth, 'recaptcha-container', {
'size': 'invisible', // [3, 58, 59]
'callback': (response) => {
// reCAPTCHA resuelto, la llamada a signInWithPhoneNumber puede proceder
},
});
this.recaptchaVerifier.render();
}
}
Paso 3.B.2: Implementación del Flujo de Código Web (JS SDK)El flujo del SDK de JS utiliza un objeto ConfirmationResult para gestionar la segunda parte del proceso.1Paso 1: Enviar el número y recibir el ConfirmationResult. (Basado en 1)TypeScriptimport { signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

// (Asumiendo que recaptchaVerifier se inicializó como en el paso anterior)
public confirmationResult: ConfirmationResult;

async function requestVerificationCodeWeb(phoneNumber: string, appVerifier: RecaptchaVerifier): Promise<void> {
try {
this.confirmationResult = await signInWithPhoneNumber(this.auth, phoneNumber, appVerifier);
// El SMS ha sido enviado por Firebase
} catch (error) {
// Error; SMS no enviado (reCAPTCHA fallido, etc.)
console.error('Error al enviar código (web):', error);
// Restablecer reCAPTCHA
appVerifier.render().then((widgetId) => grecaptcha.reset(widgetId));
throw error;
}
}
Paso 2: Enviar el código del usuario para iniciar sesión. (Basado en 1)TypeScriptasync function verifyCodeAndSignInWeb(code: string) {
if (!this.confirmationResult) {
throw new Error('ConfirmationResult no encontrado. Solicite el código primero.');
}
try {
const userCredential = await this.confirmationResult.confirm(code);
// El usuario ha iniciado sesión.
return userCredential.user;
} catch (error) {
// Error; código incorrecto, etc.
console.error('Error al verificar código (web):', error);
throw error;
}
}
V. Fase 4: Creación de un Servicio de Autenticación Híbrido UnificadoEsta fase une las dos rutas de la Fase 3 en un único servicio fácil de usar, ocultando la complejidad de la plataforma al resto de la aplicación.Paso 4.1: Configuración de la Persistencia de la Sesión (Solución de Error Crítico)Un problema notorio en Capacitor es que el estado de autenticación del SDK de JS (utilizado por el plugin y por la web) no persiste de forma fiable en las WebViews de iOS.57 El usuario inicia sesión, cierra la aplicación y está desconectado al reabrirla.La Causa: El SDK de JS utiliza por defecto localStorage (o sessionStorage), que no es fiable o es efímero en el contexto de WKWebView y capacitor://.La Solución: Se debe forzar explícitamente al SDK de Firebase a usar indexedDBLocalPersistence, que es robusto dentro de la WebView.64Implementación (ej. en app.module.ts de Angular o firebase.ts de React):TypeScriptimport { initializeApp, provideFirebaseApp, getApp } from '@angular/fire/app';
import { getAuth, provideAuth, initializeAuth, indexedDBLocalPersistence, browserLocalPersistence } from '@angular/fire/auth';
import { Capacitor } from '@capacitor/core';
import { environment } from 'src/environments/environment';

//...
imports: [
//...
provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
provideAuth(() => {
// Lógica de inicialización de Auth [8, 18, 64, 67]
if (Capacitor.isNativePlatform()) {
// Usar indexedDB para la persistencia nativa
return initializeAuth(getApp(), {
persistence: indexedDBLocalPersistence
});
} else {
// Usar la persistencia local predeterminada para la web
return initializeAuth(getApp(), {
persistence: browserLocalPersistence
});
}
}),
//...
]
Paso 4.2: Diseño del Servicio Híbrido (Abstracción de Plataforma)Se debe crear un servicio (p. ej., HybridAuthService) que utilice Capacitor.isNativePlatform() 18 para bifurcar la lógica de la Fase 3.Esqueleto de Servicio (TypeScript):TypeScriptimport { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Auth, signInWithPhoneNumber, RecaptchaVerifier, ConfirmationResult, getAuth } from 'firebase/auth';

@Injectable({ providedIn: 'root' })
export class HybridAuthService {
private webConfirmationResult: ConfirmationResult | null = null;
private nativeVerificationId: string | null = null;
private auth: Auth = getAuth();

constructor() {}

public async requestVerificationCode(phoneNumber: string, webRecaptchaVerifier?: RecaptchaVerifier) {
if (Capacitor.isNativePlatform()) {
// Ruta Nativa (Fase 3.A)
const result = await FirebaseAuthentication.signInWithPhoneNumber({ phoneNumber });
this.nativeVerificationId = result.verificationId;
} else {
// Ruta Web (Fase 3.B)
if (!webRecaptchaVerifier) throw new Error('RecaptchaVerifier es necesario para la web');
this.webConfirmationResult = await signInWithPhoneNumber(this.auth, phoneNumber, webRecaptchaVerifier);
}
}

public async verifyCodeAndSignIn(code: string) {
if (Capacitor.isNativePlatform()) {
// Ruta Nativa (Fase 3.A)
if (!this.nativeVerificationId) throw new Error('Primero debe solicitar el código');
await FirebaseAuthentication.signInWithPhoneNumber({
verificationId: this.nativeVerificationId,
verificationCode: code,
});
this.nativeVerificationId = null; // Limpiar
} else {
// Ruta Web (Fase 3.B)
if (!this.webConfirmationResult) throw new Error('Primero debe solicitar el código');
await this.webConfirmationResult.confirm(code);
this.webConfirmationResult = null; // Limpiar
}
// El listener de estado (abajo) se encargará de la redirección
}

public async signOut() {
if (Capacitor.isNativePlatform()) {
await FirebaseAuthentication.signOut();
} else {
await this.auth.signOut();
}
}
}
Paso 4.3: Implementación de un Listener de Estado de Autenticación HíbridoEl servicio también debe unificar cómo escucha los cambios de estado de autenticación. El SDK de JS usa onAuthStateChanged 68 (o el observable authState en AngularFire 71), mientras que el plugin nativo usa FirebaseAuthentication.addListener('authStateChange').63Se debe implementar un patrón que combine ambos en un único Observable o BehaviorSubject, como recomienda el mantenedor del plugin.73Implementación de Listener Híbrido (basado en 73):TypeScriptimport { BehaviorSubject } from 'rxjs';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';
import { NgZone } from '@angular/core'; // (Omitir si no es Angular)

//... dentro del servicio
private authStateSubject = new BehaviorSubject<User | null>(null);
public authState$ = this.authStateSubject.asObservable();
private auth: Auth = getAuth();

constructor(private ngZone: NgZone) { // Inyectar NgZone para Angular
this.addAuthenticationListeners();
}

async addAuthenticationListeners() {
if (Capacitor.isNativePlatform()) {
// --- Listener Nativo --- [69, 73]
FirebaseAuthentication.addListener('authStateChange', (event) => {
// Usar NgZone para asegurar la detección de cambios en Angular
this.ngZone.run(() => {
this.authStateSubject.next(event.user as User | null);
});
});

    // Cargar usuario actual en nativo
    const result = await FirebaseAuthentication.getCurrentUser();
    this.ngZone.run(() => {
      this.authStateSubject.next(result.user as User | null);
    });

} else {
// --- Listener Web --- [68, 69]
onAuthStateChanged(this.auth, (user) => {
this.authStateSubject.next(user);
});
}
}
Este authState$ se convierte en la única fuente de verdad para el estado de autenticación en toda la aplicación, y puede usarse para controlar los Route Guards (guardias de ruta) y la interfaz de usuario.72VI. Guía de Pruebas y Solución de Problemas (Troubleshooting)Los errores en este flujo son comunes y difíciles de depurar. Esta guía conecta los síntomas con las causas raíz identificadas.A. El Imperativo de las Pruebas en Dispositivos FísicosNO SE PUEDE PROBAR EN EL SIMULADOR DE iOS: El simulador de iOS no puede recibir notificaciones APNs.14 Por lo tanto, el flujo nativo de Firebase siempre fallará y recurrirá a reCAPTCHA, que también fallará en el entorno capacitor://.9 Es obligatorio realizar pruebas con un dispositivo físico de iOS.75EMULADORES DE ANDROID: Funcionarán para números reales solo si tienen Google Play Services instalado y actualizado para manejar la verificación de Play Integrity.4NÚMEROS DE PRUEBA: Use los números de prueba (Fase 1.4) para verificar la lógica de la aplicación en simuladores/emuladores, ya que omiten la verificación de la plataforma.1Flujo de Pruebas Recomendado:Web (ionic serve): Probar el flujo de reCAPTCHA y ConfirmationResult (Fase 3.B) con un número real.Simulador/Emulador: Probar solo con los números de teléfono ficticios (Fase 1.4) para verificar la lógica de UI y el servicio híbrido.Dispositivo Físico (iOS y Android): Probar el flujo nativo completo (Fase 3.A) con números de teléfono reales.B. Léxico de Errores Comunes y SolucionesError: auth/internal-error 12 o auth/operation-not-supported-in-this-environment 13 al ejecutar en un dispositivo iOS.Causa Raíz: Este es el síntoma del "fallo de fallback" (descrito en la Fase 1). Significa que la verificación de APNs (Fase 2.B) falló y el fallback a reCAPTCHA (Fase 3.B) también falló.Lista de Verificación de Soluciones (revisar Fase 2.B):¿Se subió la clave .p8 a Cloud Messaging en Firebase? (No en Auth).14¿Se proporcionó el Team ID y Key ID correctos?.47¿Están habilitadas las "Push Notifications" en las Capacidades de Xcode?.23¿Está habilitado "Remote notifications" en "Background Modes" en Xcode?.23Error: CapacitorFirebaseAuthentication.RuntimeError: 0x... 76 al ejecutar en nativo (Android o iOS).Causa Raíz: Error de configuración del plugin nativo. El plugin no pudo inicializarse.Lista de Verificación de Soluciones:¿Está GoogleService-Info.plist (iOS) o google-services.json (Android) en la ubicación correcta y añadido al target nativo?.53¿Se ejecutó npx cap sync después de añadir el plugin y los archivos de configuración?.76¿Están las huellas SHA-1/SHA-256 (Fase 2.A) añadidas a la configuración de la app de Android en Firebase?.22¿Se especificó "phone" en la matriz providers en capacitor.config.ts?.19Error: RecaptchaVerifier failed: First argument “recaptchaContainer” must be... 20 al ejecutar en la web (ionic serve).Causa Raíz: Problema de tiempo del ciclo de vida de Ionic/Angular. Se está intentando crear new RecaptchaVerifier antes de que <div id="recaptcha-container"> exista en el DOM.Solución: Mover la inicialización de RecaptchaVerifier a un hook de ciclo de vida que se ejecute después de que la vista esté renderizada (p. ej., ionViewDidEnter, ngAfterViewInit 60 o useEffect 20).Error: El usuario inicia sesión, pero está desconectado después de reiniciar la aplicación en iOS.57Causa Raíz: Falla la persistencia del estado de autenticación en la WebView.Solución: Implementar la inicialización de indexedDBLocalPersistence como se detalla en la Fase 4.1.64VII. ConclusiónLa implementación de la autenticación telefónica de Firebase en Ionic/Capacitor es una tarea de alta complejidad que va más allá de un simple tutorial. El éxito no depende de una sola API, sino de la orquestación de tres configuraciones de plataforma distintas (Firebase, Android Nativo, iOS Nativo) y dos flujos de código (JS SDK y Plugin Nativo).La arquitectura de verificación de aplicaciones de Firebase, diseñada para modelos de seguridad web y nativos separados, crea un conflicto directo en el entorno capacitor:// de iOS, haciendo que el SDK de JS estándar falle.La única solución robusta y preparada para producción, como se detalla en este informe, es una arquitectura híbrida:Configuración Meticulosa: Vincular la facturación 35, configurar números de prueba 1, registrar huellas SHA-1/SHA-256 22 y configurar APNs .p8 en Cloud Messaging.14Plugin Nativo: Usar @capacitor-firebase/authentication para compilaciones nativas para manejar correctamente Play Integrity y APNs.17SDK de JS: Usar el SDK de firebase/auth estándar solo para entornos web (ionic serve) y PWA.1Persistencia: Forzar indexedDBLocalPersistence para resolver problemas de pérdida de sesión en iOS.64Abstracción: Unificar ambos flujos y sus respectivos listeners de estado de autenticación (onAuthStateChanged y addListener) en un único servicio híbrido que detecte la plataforma.19Si bien este enfoque es complejo, es el único que aborda todos los puntos de falla conocidos y proporciona una experiencia de autenticación telefónica segura y persistente para los usuarios en todas las plataformas.
