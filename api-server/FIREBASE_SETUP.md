# 🔔 Configuración de Firebase Cloud Messaging (Push Notifications)

Este documento explica cómo configurar Firebase Cloud Messaging para habilitar las notificaciones push en Delivery Go Fast.

## 📋 Requisitos previos

- Cuenta de Google
- Acceso a [Firebase Console](https://console.firebase.google.com)
- Permisos para crear proyectos en Firebase

## 🚀 Pasos de configuración

### 1. Crear proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Haz clic en **"Agregar proyecto"** o **"Add project"**
3. Nombra tu proyecto: `delivery-go-fast` (o el nombre que prefieras)
4. Acepta los términos y condiciones
5. Habilita Google Analytics (opcional pero recomendado)
6. Haz clic en **"Crear proyecto"**

### 2. Obtener credenciales del servidor (Service Account)

1. En tu proyecto de Firebase, ve a **⚙️ Configuración del proyecto** (Project Settings)
2. Ve a la pestaña **"Cuentas de servicio"** (Service Accounts)
3. Haz clic en **"Generar nueva clave privada"** (Generate new private key)
4. Se descargará un archivo JSON con un nombre como:
   ```
   delivery-go-fast-firebase-adminsdk-xxxxx-xxxxxxxxxx.json
   ```
5. **IMPORTANTE**: Renombra este archivo a:
   ```
   firebase-service-account.json
   ```
6. Mueve este archivo a la carpeta raíz de `api-server`:
   ```
   api-server/
   ├── firebase-service-account.json  ← Aquí
   ├── src/
   ├── package.json
   └── ...
   ```

### 3. Configurar variables de entorno

Agrega esta línea al archivo `.env` en `api-server`:

```env
# Firebase Cloud Messaging
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

### 4. Agregar al .gitignore

**CRÍTICO**: Asegúrate de que el archivo de credenciales NO se suba a GitHub.

Agrega esto al `.gitignore` de `api-server`:

```gitignore
# Firebase credentials
firebase-service-account.json
*.json
!package.json
!package-lock.json
!tsconfig.json
!tsconfig.build.json
!nest-cli.json
```

### 5. Configurar la aplicación móvil (Frontend)

#### Para Android:

1. En Firebase Console, haz clic en el ícono de Android ⚙️
2. Registra tu app con el **nombre del paquete**:
   ```
   com.deliverygofast.app
   ```
   (O el que uses en `capacitor.config.ts`)
3. Descarga el archivo `google-services.json`
4. Colócalo en:
   ```
   delivery-frontend/android/app/google-services.json
   ```
5. Firebase agregará automáticamente las dependencias necesarias

#### Para iOS:

1. En Firebase Console, haz clic en el ícono de iOS
2. Registra tu app con el **Bundle ID**:
   ```
   com.deliverygofast.app
   ```
3. Descarga el archivo `GoogleService-Info.plist`
4. Ábrelo en Xcode y agrégalo al proyecto
5. Configura las capacidades de Push Notifications en Xcode

### 6. Verificar instalación

Reinicia el servidor backend:

```bash
cd api-server
npm run start:dev
```

Deberías ver en los logs:

```
✅ Firebase Admin SDK inicializado correctamente
```

Si ves:

```
⚠️ FIREBASE_SERVICE_ACCOUNT_PATH no configurado
```

Revisa que:

- El archivo `firebase-service-account.json` exista en `api-server/`
- La variable `FIREBASE_SERVICE_ACCOUNT_PATH` esté en `.env`
- El path sea correcto: `./firebase-service-account.json`

## 🧪 Pruebas

### Probar desde el backend (opcional)

Puedes crear un endpoint temporal para probar:

```typescript
// En notifications.controller.ts
@Post('test')
async testNotification(@Req() req: any) {
  await this.notificationsService.sendToUser(req.user.userId, {
    title: '🔔 Prueba de Notificación',
    body: 'Si ves esto, ¡Firebase está funcionando!',
  });
  return { message: 'Notificación enviada' };
}
```

## 📱 Configuración del Frontend

### 1. Instalar plugin de Capacitor

```bash
cd delivery-frontend
npm install @capacitor/push-notifications
npx cap sync
```

### 2. Configurar permisos

El código ya está implementado en el servicio de notificaciones del frontend.

## 🔐 Seguridad

### ⚠️ IMPORTANTE - NO SUBIR CREDENCIALES

**NUNCA** subas los siguientes archivos a GitHub:

- ❌ `firebase-service-account.json`
- ❌ `google-services.json`
- ❌ `GoogleService-Info.plist`

Estos archivos contienen claves privadas y pueden comprometer la seguridad de tu aplicación.

### ✅ Buenas prácticas

1. **Desarrollo**: Usa archivo local `firebase-service-account.json`
2. **Producción**: Usa variables de entorno en el servidor
3. **CI/CD**: Usa secretos encriptados (GitHub Secrets, etc.)
4. **Team**: Comparte credenciales por canales seguros (1Password, LastPass, etc.)

## 🌍 Configuración de producción

Para producción, puedes usar variables de entorno en lugar del archivo:

```typescript
// En notifications.service.ts, reemplaza:
const serviceAccount = require(`../../${serviceAccountPath}`);

// Por:
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
};
```

## 📊 Monitoreo

Firebase Console ofrece analytics para notificaciones:

- **Cloud Messaging**: Ve cuántas notificaciones se envían
- **Analytics**: Rastrea cuántas se abren
- **Crashlytics**: Detecta errores en la app

## 🆘 Solución de problemas

### "Firebase no está inicializado"

- Verifica que el archivo JSON existe
- Revisa la ruta en `.env`
- Reinicia el servidor

### "Permission denied" al enviar notificación

- El token del dispositivo puede haber expirado
- El usuario desinstalaron la app
- Los permisos de notificaciones están deshabilitados

### Notificaciones no llegan en iOS

- Verifica que tienes el certificado APNs configurado
- Revisa que el Bundle ID coincida
- Comprueba los permisos en Xcode

## 📚 Referencias

- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

---

**¿Necesitas ayuda?** Revisa los logs del backend para más detalles de errores.
