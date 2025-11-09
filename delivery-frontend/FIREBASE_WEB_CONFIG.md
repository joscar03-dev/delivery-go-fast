# 🔥 Configuración de Firebase Web SDK

## 📋 Cómo obtener las credenciales de Firebase Web

### Paso 1: Accede a Firebase Console

1. Ve a https://console.firebase.google.com/
2. Selecciona tu proyecto: **delivery-go-fast**

### Paso 2: Obtén las credenciales Web

1. En el menú lateral, haz clic en el ícono del engranaje ⚙️ → **Project Settings**
2. En la pestaña **General**, desplázate hacia abajo hasta la sección **Your apps**
3. Si ya tienes una app Web registrada:
   - Haz clic en ella para ver las credenciales
4. Si NO tienes una app Web:
   - Haz clic en el botón **Add app** o el ícono `</>`
   - Pon un nombre como: **Delivery Go Fast Web**
   - **NO** marques "Also set up Firebase Hosting"
   - Haz clic en **Register app**

### Paso 3: Copia las credenciales

Verás un objeto `firebaseConfig` como este:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "delivery-go-fast.firebaseapp.com",
  projectId: "delivery-go-fast",
  storageBucket: "delivery-go-fast.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890",
};
```

### Paso 4: Actualiza environment.ts

Copia los valores y reemplázalos en:

- `delivery-frontend/src/environments/environment.ts`
- `delivery-frontend/src/environments/environment.prod.ts` (cuando lo crees)

```typescript
export const environment = {
  production: false,
  apiUrl: "http://localhost:3000",
  firebase: {
    apiKey: "TU_API_KEY_AQUI",
    authDomain: "delivery-go-fast.firebaseapp.com",
    projectId: "delivery-go-fast",
    storageBucket: "delivery-go-fast.appspot.com",
    messagingSenderId: "TU_SENDER_ID",
    appId: "TU_APP_ID",
  },
};
```

## ⚠️ IMPORTANTE

### Diferencia entre Service Account y Web SDK:

- **Service Account** (`firebase-service-account.json`):

  - Usado en el BACKEND (api-server)
  - Contiene private_key, client_email
  - Permisos de administrador
  - ❌ NUNCA debe exponerse al frontend

- **Web SDK Config** (environment.ts):
  - Usado en el FRONTEND (delivery-frontend)
  - Contiene apiKey, authDomain, appId
  - Solo para autenticación de usuarios
  - ✅ Se puede exponer (está en el código del cliente)

### Habilitar Phone Authentication:

1. En Firebase Console, ve a **Authentication** → **Sign-in method**
2. Haz clic en **Phone**
3. Activa el toggle **Enable**
4. Configura reCAPTCHA (se configura automáticamente)
5. Guarda los cambios

### Dominios autorizados:

Por defecto, Firebase permite:

- `localhost` (para desarrollo)
- `*.firebaseapp.com` (hosting de Firebase)

Para producción, agrega tu dominio:

1. Authentication → Settings → Authorized domains
2. Haz clic en **Add domain**
3. Agrega: `gofastdelivery.site` (o tu dominio)

## 🧪 Testing

### Números de teléfono de prueba:

Firebase permite agregar números de prueba que no envían SMS real:

1. Authentication → Sign-in method → Phone
2. Desplázate hasta **Phone numbers for testing**
3. Agrega números como:
   - `+51999999999` con código `123456`
   - `+51888888888` con código `654321`

Estos números NO enviarán SMS real, pero aceptarán el código configurado.

## 🚀 Próximos pasos

Una vez tengas las credenciales:

1. ✅ Actualiza `environment.ts` con tus valores reales
2. ✅ Habilita Phone Authentication en Firebase Console
3. ✅ Continúa con la implementación de PhoneAuthService
