# 📱 Configuración de Push Notifications - Frontend

Guía para configurar las notificaciones push en la aplicación móvil de Delivery Go Fast.

## 📋 Requisitos previos

1. Backend configurado con Firebase (ver `api-server/FIREBASE_SETUP.md`)
2. Proyecto de Firebase creado
3. Capacitor instalado (`@capacitor/push-notifications`)

## 🤖 Configuración para Android

### 1. Registrar app en Firebase Console

1. Ve a tu proyecto en [Firebase Console](https://console.firebase.google.com)
2. Haz clic en el ícono de Android (⚙️)
3. Ingresa el **package name**:
   ```
   com.deliverygofast.app
   ```
   (Este debe coincidir con `appId` en `capacitor.config.ts`)
4. (Opcional) Ingresa un apodo para la app: `Delivery Go Fast Android`
5. (Opcional) Firma de depuración SHA-1 (para testing)

### 2. Descargar google-services.json

1. Descarga el archivo `google-services.json`
2. Colócalo en:
   ```
   delivery-frontend/android/app/google-services.json
   ```

### 3. Configurar build.gradle

Abre `android/build.gradle` y verifica que tenga:

```gradle
buildscript {
    dependencies {
        // ...
        classpath 'com.google.gms:google-services:4.3.15'
    }
}
```

Abre `android/app/build.gradle` y agrega al final:

```gradle
apply plugin: 'com.google.gms.google-services'
```

### 4. Sincronizar cambios

```bash
cd delivery-frontend
npx cap sync android
```

### 5. Probar en Android

```bash
npx cap run android
```

## 🍎 Configuración para iOS

### 1. Configurar Apple Developer Account

1. Ve a [Apple Developer](https://developer.apple.com)
2. Crea un **App ID** con:
   - Bundle ID: `com.deliverygofast.app`
   - Capabilities: Habilita **Push Notifications**

### 2. Crear certificado APNs

1. En Apple Developer → Certificates
2. Crea un nuevo certificado:
   - Tipo: **Apple Push Notification service SSL (Sandbox & Production)**
   - App ID: Selecciona `com.deliverygofast.app`
3. Descarga el certificado `.p12`

### 3. Subir certificado a Firebase

1. Ve a Firebase Console → Project Settings
2. Pestaña **Cloud Messaging**
3. Sección **iOS app configuration**
4. Sube el archivo `.p12` del certificado APNs

### 4. Descargar GoogleService-Info.plist

1. En Firebase Console, descarga `GoogleService-Info.plist`
2. Abre el proyecto en Xcode:
   ```bash
   npx cap open ios
   ```
3. Arrastra `GoogleService-Info.plist` a la carpeta **App** en Xcode
4. Marca **"Copy items if needed"**

### 5. Habilitar Push Notifications en Xcode

1. En Xcode, selecciona el proyecto
2. Ve a **Signing & Capabilities**
3. Haz clic en **+ Capability**
4. Agrega **Push Notifications**
5. Agrega **Background Modes** y marca:
   - ✅ Remote notifications

### 6. Probar en iOS

```bash
npx cap run ios
```

## 🧪 Testing

### Probar permisos de notificaciones

Al hacer login, la app debe:

1. Solicitar permisos de notificaciones
2. Mostrar en console:
   ```
   📱 Inicializando Push Notifications...
   📱 Push token recibido: [token]
   ✅ Token enviado al backend
   ```

### Probar recepción de notificaciones

1. **Backend en desarrollo**:
   - Crear un endpoint de prueba (temporal):
   ```typescript
   // En notifications.controller.ts
   @Post('test')
   async testPush(@Req() req: any) {
     await this.notificationsService.sendToUser(req.user.userId, {
       title: '🧪 Prueba',
       body: 'Notificación de prueba funcionando!',
     });
     return { sent: true };
   }
   ```
2. **Llamar al endpoint**:

   ```bash
   curl -X POST http://localhost:3000/notifications/test \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. **Verificar**:
   - App cerrada: Debe aparecer notificación en el sistema
   - App abierta: Debe aparecer en console
   - Tocar notificación: Debe navegar a la pantalla correcta

## 🔄 Sistema Híbrido (Socket.IO + Push)

La app usa un sistema híbrido inteligente:

### Cuando la app está ABIERTA:

- ✅ Socket.IO maneja las actualizaciones en tiempo real
- ✅ UI se actualiza instantáneamente
- ⏭️ Push notifications se ignoran (no necesarias)

### Cuando la app está CERRADA/BACKGROUND:

- ⏭️ Socket.IO no está conectado
- ✅ Push Notifications despiertan la app
- ✅ Usuario recibe notificación del sistema operativo
- ✅ Al tocar, app abre en la pantalla correcta

## 🛠️ Troubleshooting

### Android

**❌ Error: "google-services.json not found"**

- Verifica que el archivo esté en `android/app/google-services.json`
- Ejecuta `npx cap sync android`

**❌ Error: "Firebase is not initialized"**

- Asegúrate de tener `apply plugin: 'com.google.gms.google-services'` en `app/build.gradle`

**❌ No recibo notificaciones**

- Verifica permisos en ajustes del dispositivo
- Revisa logs de Logcat en Android Studio
- Confirma que el token se envió al backend

### iOS

**❌ Error: "No valid 'aps-environment' entitlement"**

- Verifica que Push Notifications esté habilitado en Capabilities
- Asegúrate de tener un perfil de aprovisionamiento válido

**❌ Error: "Missing GoogleService-Info.plist"**

- Arrastra el archivo a Xcode (no solo copiar en Finder)
- Debe estar en el target de la app

**❌ No recibo notificaciones**

- Verifica que el certificado APNs esté configurado en Firebase
- Prueba en un dispositivo real (no en simulador)
- Revisa logs en Xcode

## 📊 Monitoreo

### Logs importantes

**Frontend (Console del navegador/dispositivo)**:

```
📱 Inicializando Push Notifications...
✅ Listeners de push notifications registrados
✅ Dispositivo registrado para push notifications
📱 Push token recibido: [token]
✅ Token enviado al backend
```

**Backend (Terminal)**:

```
✅ Firebase Admin SDK inicializado correctamente
✅ Token de dispositivo registrado para usuario [id] (android)
📨 Notificación enviada a usuario [id]: 1 exitosas, 0 fallidas
✅ [Socket.IO] Estado actualizado para pedido [id]
✅ [Push Notification] Enviada al cliente para pedido [id]
```

### Verificar en Firebase Console

1. Ve a **Cloud Messaging** → **Campaigns**
2. Envía una notificación de prueba
3. Ingresa el token FCM del dispositivo
4. Verifica que llegue

## 🔒 Seguridad

### Buenas prácticas

1. ✅ Nunca subir `google-services.json` a Git público
2. ✅ Nunca subir `GoogleService-Info.plist` a Git público
3. ✅ Tokens FCM se invalidan al desinstalar app
4. ✅ Desregistrar tokens al hacer logout
5. ✅ Verificar permisos antes de mostrar notificaciones

### .gitignore

Asegúrate de tener en `.gitignore`:

```gitignore
# Firebase
google-services.json
GoogleService-Info.plist

# Capacitor
android/
ios/
```

## 📱 Personalización

### Canales de notificaciones (Android 8+)

Puedes crear canales personalizados en `android/app/src/main/res/values/strings.xml`:

```xml
<resources>
    <string name="default_notification_channel_name">Pedidos</string>
    <string name="new_order_channel_name">Nuevos Pedidos</string>
    <string name="delivery_channel_name">Entregas</string>
</resources>
```

### Iconos personalizados

Agrega iconos en:

- Android: `android/app/src/main/res/drawable-*/notification_icon.png`
- iOS: Configura en Xcode

### Sonidos personalizados

Agrega archivos de audio en:

- Android: `android/app/src/main/res/raw/notification_sound.mp3`
- iOS: `ios/App/App/Sounds/notification_sound.wav`

## 🚀 Despliegue

### Antes de publicar en stores

1. ✅ Usar certificados de producción (no desarrollo)
2. ✅ Probar en dispositivos reales
3. ✅ Configurar iconos y sonidos personalizados
4. ✅ Configurar deep links si es necesario
5. ✅ Actualizar Privacy Policy con info de notificaciones

### Play Store (Android)

- Asegúrate de firmar con el keystore de producción
- El `google-services.json` debe tener las credenciales de producción

### App Store (iOS)

- Usa el certificado APNs de **Production** (no Sandbox)
- Prueba con TestFlight antes de release

---

**¿Problemas?** Revisa los logs del backend y frontend para más detalles.
