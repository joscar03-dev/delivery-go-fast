Requisito Crítico (2025): Implementación de Canales de Notificación

Para cualquier aplicación dirigida a Android 8.0 (API 26) o superior, las notificaciones deben ser asignadas a un "Canal de Notificación".19 Este es un requisito del sistema operativo "ACTUAL" y es fundamental para su caso de uso.

Si no se especifica un canal, Android utilizará un canal predeterminado de baja prioridad. Esto significa que las notificaciones críticas de "Nuevo Pedido" pueden no emitir sonido, no vibrar y no aparecer en la pantalla de bloqueo. Para que la notificación "tenga que salir" [Consulta del Usuario], debe crear un canal de alta prioridad.

El plugin de Capacitor permite crear canales mediante programación desde su código Ionic/Angular.20 Esta llamada debe realizarse en la inicialización de la aplicación (ver Sección V).

Ejemplo de Creación de Canal (TypeScript):

TypeScript

import { PushNotifications, Channel } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

//... dentro de su servicio de inicialización...
if (Capacitor.getPlatform() === 'android') {
const channel: Channel = {
id: 'pedidos_criticos',
name: 'Nuevos Pedidos',
description: 'Notificaciones de alta prioridad para nuevos pedidos.',
importance: 5, // Nivel 5 es "URGENTE"
sound: 'default', // O 'custom_alert.wav' (ver Sección IX)
vibration: true,
visibility: 1, // VISIBILITY_PUBLIC
lights: true,
lightColor: '#FF0000', // Rojo
};
await PushNotifications.createChannel(channel);
}

Luego, cuando envíe el mensaje desde su Cloud Function (Sección VI), deberá especificar este id de canal en el payload de Android para que el sistema operativo utilice esta configuración de alta prioridad.

Tabla 1: Propiedades Clave del Canal de Notificación (Android)

Esta tabla detalla las propiedades esenciales del objeto Channel para maximizar la visibilidad de las notificaciones de delivery.19

Propiedad

Tipo

Descripción

Valor Recomendado para "Pedidos"

id

string

El identificador único del canal.

'pedidos_criticos'

name

string

El nombre visible para el usuario en la configuración de la app.

'Nuevos Pedidos'

description

string

La descripción visible para el usuario.

'Notificaciones de nuevos pedidos'

importance

number

El nivel de interrupción (1-5). 5 es el más alto.

5

sound

string

El archivo de sonido (en res/raw).

'default' (o un sonido personalizado)

vibration

boolean

Habilita la vibración.

true

visibility

number

Visibilidad en la pantalla de bloqueo (1 = Público).

1

lights

boolean

Habilita el LED de notificación.

true

Sección V: Implementación del Lado del Cliente (Servicio Angular en Ionic)

Esta sección detalla el código TypeScript necesario dentro de su aplicación Ionic/Angular. La arquitectura recomendada es crear un PushNotificationService (@Injectable({ providedIn: 'root' })) que se inicialice una vez en app.component.ts.

La lógica de inicialización en app.component.ts garantiza que los listeners de notificaciones se registren tan pronto como la aplicación se inicie, lo que es esencial para manejar las notificaciones que abren la aplicación desde un estado cerrado.12

Inicialización y Solicitud de Permisos

El primer paso es solicitar permiso explícito al usuario para recibir notificaciones. En iOS, esto es obligatorio.11 En Android 13 (API 33) y versiones posteriores, también es obligatorio.

TypeScript

// En push-notification.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import {
PushNotifications,
Token,
PushNotificationSchema,
ActionPerformed,
PermissionStatus
} from '@capacitor/push-notifications';
// Importar controladores de UI (p. ej., ToastController) si es necesario

@Injectable({
providedIn: 'root'
})
export class PushNotificationService {

constructor(private router: Router) {}

public async initPush() {
if (Capacitor.getPlatform() === 'web') {
return; // Los PWA se manejan de manera diferente
}

// 1. Solicitar Permisos
await this.requestPermissions();

// 2. Inicializar listeners
this.addListeners();
}

private async requestPermissions() {
let permStatus: PermissionStatus = await PushNotifications.checkPermissions();

if (permStatus.receive === 'prompt') {
permStatus = await PushNotifications.requestPermissions();
}

if (permStatus.receive!== 'granted') {
console.warn('Permiso de notificaciones no concedido.');
// Opcionalmente, mostrar una alerta pidiendo al usuario que habilite los permisos en la configuración.
return;
}

// 3. Registrarse en FCM/APNs
// Solo registrar si el permiso fue concedido
await PushNotifications.register();
}

//... resto del servicio
}

Registro y Captura del Token FCM

Una vez que se llama a register(), el plugin se comunica con FCM/APNs en segundo plano. Cuando tiene éxito, se dispara el listener 'registration'. Este es el momento más importante: debe capturar este token y enviarlo a su backend (Firestore) para asociarlo con el usuario actual.14

TypeScript

// En push-notification.service.ts (continuación)

private addListeners() {
// Se dispara al registrarse exitosamente
PushNotifications.addListener('registration', (token: Token) => {
console.log('Token de registro obtenido:', token.value);

     //!! LÓGICA CRÍTICA DE BACKEND!!
     // Envíe este token.value a su backend (Firestore) y asócielo
     // con el ID de usuario o restaurante actualmente autenticado.
     // Ejemplo: this.firestoreService.saveTokenForUser(token.value);

});

// Se dispara si el registro falla
PushNotifications.addListener('registrationError', (err: any) => {
console.error('Error en el registro de notificaciones:', err);
});

//... más listeners a continuación
}

Manejo de Notificaciones en Primer Plano (pushNotificationReceived)

Este listener se dispara solo si se recibe una notificación mientras la aplicación está abierta y en primer plano.11 Por defecto, el SO no muestra la notificación en este estado. Esto le da la oportunidad de mostrar una alerta en la aplicación (como un toast o un modal).12

TypeScript

// En push-notification.service.ts (continuación de addListeners)

// Se dispara al recibir una notificación en primer plano
PushNotifications.addListener('pushNotificationReceived',
(notification: PushNotificationSchema) => {
console.log('Push recibido en primer plano:', notification);

       // Ejemplo: Mostrar un Toast de Ionic
       // const toast = await this.toastController.create({
       //   message: notification.title,
       //   duration: 3000
       // });
       // toast.present();
     }

);

Manejo de la Interacción del Usuario (pushNotificationActionPerformed)

Este es el listener más importante para la navegación y el deep-linking. Se dispara cuando un usuario toca la notificación en la bandeja del sistema, lo que abre la aplicación (ya sea desde el segundo plano o desde un estado cerrado).12

Aquí es donde se extrae el payload de data (ver Sección VII) para navegar al usuario a la pantalla relevante.

TypeScript

// En push-notification.service.ts (continuación de addListeners)

// Se dispara cuando el usuario TOCA la notificación
PushNotifications.addListener('pushNotificationActionPerformed',
(action: ActionPerformed) => {
console.log('Acción de push realizada:', action);

       // Extraer datos personalizados
       const data = action.notification.data;

       if (data.orderId) {
         // Navegar a la página específica del pedido
         this.router.navigate(['/orders', data.orderId]);
       } else {
         // Acción genérica, p. ej., ir al dashboard
         this.router.navigate(['/home']);
       }
     }

);
} // Fin de addListeners
} // Fin del servicio

Finalmente, asegúrese de inicializar este servicio en app.component.ts:

TypeScript

// En app.component.ts
import { Component, OnInit } from '@angular/core';
import { PushNotificationService } from './services/push-notification.service';

@Component({
selector: 'app-root',
templateUrl: 'app.component.html',
styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
constructor(private pushService: PushNotificationService) {}

ngOnInit() {
this.initializeApp();
}

initializeApp() {
//... otra lógica de inicialización...

// Inicializar el servicio de notificaciones push
this.pushService.initPush();
}
}

Sección VI: Arquitectura del Backend (Cloud Functions y Firestore)

El "cerebro" del sistema reside en Cloud Functions.38 Estas funciones de backend (escritas en TypeScript o Node.js) reaccionarán a los cambios en la base de datos y enviarán las notificaciones.39

Diseño de la Base de Datos: Almacenamiento de Tokens

Como se estableció en la Sección I, el modelo de datos es crucial. Los tokens se almacenarán en subcolecciones para admitir múltiples dispositivos.8

Para clientes: users/{userId}/fcmTokens/{tokenId}
Para restaurantes: restaurants/{restaurantId}/fcmTokens/{tokenId}
El documento {tokenId} debe contener el token y un createdAt timestamp para una futura limpieza de tokens obsoletos.8

Lógica Central: Creación de Triggers de Cloud Function (TypeScript)

Se necesitan dos funciones principales para el caso de uso del delivery.

Caso de Uso 1: Nuevo Pedido al Restaurante (Trigger onCreate)

Esta función se dispara cuando se crea un nuevo documento en la colección orders. Su trabajo es notificar al restaurante.41

TypeScript

// En index.ts (proyecto de Cloud Functions)
import _ as functions from 'firebase-functions';
import _ as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

export const onNewOrderCreated = functions.firestore
.document('orders/{orderId}')
.onCreate(async (snapshot, context) => {

const orderData = snapshot.data();
if (!orderData) return;

const restaurantId = orderData.restaurantId;
const orderId = context.params.orderId;

// 1. Obtener todos los tokens para ese restaurante
const tokensSnapshot = await db
.collection(`restaurants/${restaurantId}/fcmTokens`)
.get();

if (tokensSnapshot.empty) {
console.log('No hay tokens para el restaurante:', restaurantId);
return;
}

const tokens: string = tokensSnapshot.docs.map(doc => doc.data().token);

// 2. Construir el payload (VER SECCIÓN VII para detalles)
const payload = {
notification: {
title: '¡Nuevo Pedido!',
body: `Pedido #${orderId.substring(0, 6)}: ${orderData.itemSummary}`,
sound: 'default' // O un sonido personalizado
},
data: {
orderId: orderId,
type: 'NEW_ORDER'
},
// Configuración de APNs (iOS)
apns: {
payload: {
aps: {
'content-available': 1,
sound: 'default' // O 'custom_sound.caf'
},
},
},
// Configuración de Android
android: {
notification: {
channelId: 'pedidos_criticos' // ID del canal de la Sección III
}
}
};

// 3. Enviar a todos los dispositivos del restaurante
try {
await messaging.sendToDevice(tokens, payload);
console.log('Notificación de nuevo pedido enviada a:', restaurantId);
} catch (error) {
console.error('Error al enviar notificación:', error);
// TODO: Implementar limpieza de tokens (ver Sección IX)
}
});

Caso de Uso 2: Actualización de Estado al Cliente (Trigger onUpdate)

Esta función se dispara cuando un documento de pedido cambia, por ejemplo, el status. Su trabajo es notificar al cliente.3

TypeScript

// En index.ts (proyecto de Cloud Functions)

export const onOrderStatusUpdate = functions.firestore
.document('orders/{orderId}')
.onUpdate(async (change, context) => {

const beforeData = change.before.data();
const afterData = change.after.data();

// Solo notificar si el 'status' realmente cambió
if (beforeData.status === afterData.status) {
console.log('Actualización sin cambio de estado, no se notifica.');
return;
}

const userId = afterData.userId;
const orderId = context.params.orderId;

// 1. Obtener todos los tokens para ese cliente
const tokensSnapshot = await db
.collection(`users/${userId}/fcmTokens`)
.get();

if (tokensSnapshot.empty) {
console.log('No hay tokens para el usuario:', userId);
return;
}
const tokens = tokensSnapshot.docs.map(doc => doc.data().token);

// 2. Construir el payload
const payload = {
notification: {
title: '¡El estado de tu pedido ha cambiado!',
body: `Tu pedido ahora está: ${afterData.status}`
},
data: {
orderId: orderId,
newStatus: afterData.status,
type: 'STATUS_UPDATE'
}
};

// 3. Enviar a todos los dispositivos del cliente [4, 42]
try {
await messaging.sendToDevice(tokens, payload);
console.log('Notificación de estado enviada a:', userId);
} catch (error) {
console.error('Error al enviar notificación:', error);
}
});

Sección VII: El Núcleo del Problema: Garantizar la Entrega en Segundo Plano y con la App Cerrada

Este es el requisito más crítico del usuario ("a pesar de que este fuera de la app") y la causa del 99% de los fracasos en las implementaciones de notificaciones push. El problema radica en la diferencia fundamental entre los payloads notification y data de FCM.

La Distinción Crítica: notification vs. data

FCM permite enviar dos tipos de mensajes 43:

Mensajes de Notificación (Payload notification):
Qué es: Un objeto JSON con claves predefinidas: title, body, sound, icon.
Comportamiento (Segundo Plano / Cerrada): Estos mensajes son manejados directamente por el Sistema Operativo.37 El SO muestra la notificación en la bandeja del sistema automáticamente.
El Problema: El código de su aplicación (el listener pushNotificationReceived) no se ejecuta.
Mensajes de Datos (Payload data):
Qué es: Un objeto JSON con claves y valores personalizados (p. ej., {"orderId": "12345"}).
Comportamiento (Segundo Plano / Cerrada): El SO recibe el mensaje pero no hace nada con él. No se muestra ninguna notificación visual.44 El mensaje se "despierta" silenciosamente en su aplicación, pero el plugin de Capacitor no lo procesará a menos que se implemente código nativo personalizado (lo cual queremos evitar).11
Comportamiento (Primer Plano): El mensaje se entrega directamente al listener pushNotificationReceived.43

La Solución: El Payload Mixto (notification + data)

El problema es claro:

Si envía solo notification, obtiene una alerta visual pero no puede pasar datos de deep-linking de manera fiable a su listener pushNotificationActionPerformed.
Si envía solo data, su aplicación recibe los datos (en primer plano) pero no se muestra ninguna notificación cuando la aplicación está cerrada. Un fracaso total para un delivery.
La única arquitectura de payload fiable para este caso de uso es enviar ambos payloads en el mismo mensaje.37

El objeto notification le dice al SO: "Muestra esta notificación visual en la bandeja del sistema".
El objeto data "viaja" junto con esa notificación.
Cuando el usuario toca la notificación (que fue mostrada por el SO), el SO abre la aplicación. El plugin de Capacitor es lo suficientemente inteligente como para interceptar esta apertura, extraer el payload data que venía adjunto y entregárselo limpiamente a su listener pushNotificationActionPerformed (Sección V).
Esto le da lo mejor de ambos mundos: visibilidad garantizada por el SO y capacidad de deep-linking a través de su código Angular.

Tabla 2: Matriz de Comportamiento del Payload de FCM (Android/iOS)

Esta matriz resume el comportamiento del plugin @capacitor/push-notifications según el payload y el estado de la aplicación.37

Payload Enviado

Estado de la App

¿Se Muestra en Bandeja del Sistema?

¿pushNotificationReceived se Dispara?

¿pushNotificationActionPerformed se Dispara (al tocar)?

Solo notification

Primer Plano

No

Sí

N/A

Solo notification

Segundo Plano / Cerrada

Sí (Manejado por SO)

No

Sí (pero data está vacío)

Solo data

Primer Plano

No

Sí

N/A

Solo data

Segundo Plano / Cerrada

No (Falla Crítica)

No

No

notification + data (Recomendado)

Primer Plano

No

Sí (recibe ambos)

N/A

notification + data (Recomendado)

Segundo Plano / Cerrada

Sí (Manejado por SO)

No

Sí (Recibe data)

Mejora Específica de Android: click_action

Existe una peculiaridad de Android en la que, a veces, cuando la aplicación está completamente cerrada (estado killed), tocar la notificación solo abre la aplicación pero no dispara el listener pushNotificationActionPerformed.

La solución es doble 37:

En la Cloud Function: Al construir el payload, agregue la propiedad click_action: 'FCM_PLUGIN_ACTIVITY' dentro del objeto notification.
JavaScript
// Payload de ejemplo en la Cloud Function
const payload = {
notification: {
title: '¡Nuevo Pedido!',
body: '...',
click_action: 'FCM_PLUGIN_ACTIVITY' // <-- ¡IMPORTANTE!
},
data: {
orderId: '12345'
},
//...
};
En el Proyecto Android: Edite manualmente el archivo android/app/src/main/AndroidManifest.xml y agregue el siguiente intent-filter dentro de la etiqueta <activity> principal (.MainActivity):
XML
<activity...>
<intent-filter>
<action android:name="FCM_PLUGIN_ACTIVITY" />
<category android:name="android.intent.category.DEFAULT" />
</intent-filter>

</activity>
Esto crea un vínculo explícito entre la notificación y la Actividad principal de su aplicación, asegurando que el plugin de Capacitor reciba el evento de "clic" de manera fiable.
