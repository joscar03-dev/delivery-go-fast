# 🔧 Fix: auth/invalid-app-credential

## 🔍 Diagnóstico del Error

El error `auth/invalid-app-credential` ocurre cuando Firebase no puede validar tu aplicación web. Esto sucede porque:

1. **El dominio no está autorizado**: `localhost` debe estar en la lista blanca de dominios autorizados
2. **La API Key tiene restricciones**: La API Key puede estar restringida y no permitir autenticación por teléfono
3. **Falta configuración SHA-1/SHA-256**: Para Android, se requieren las huellas digitales

## ✅ SOLUCIÓN 1: Autorizar Dominios en Firebase Console (MÁS RÁPIDA)

### Paso 1: Ir a Firebase Console

1. Abre: https://console.firebase.google.com/project/delivery-go-fast/authentication/settings
2. O navega manualmente:
   - Firebase Console → Tu proyecto `delivery-go-fast`
   - Authentication → Settings (pestaña)
   - Busca la sección "Authorized domains"

### Paso 2: Agregar localhost

En la sección **"Authorized domains"**, asegúrate de tener:

- ✅ `localhost` (para desarrollo web)
- ✅ `127.0.0.1` (opcional, para desarrollo)
- ✅ `delivery-go-fast.firebaseapp.com` (dominio por defecto de Firebase)

**Cómo agregar:**

1. Click en "Add domain"
2. Escribe: `localhost`
3. Click en "Add"

### Paso 3: Verificar API Key

1. Ve a: https://console.firebase.google.com/project/delivery-go-fast/settings/general
2. En la sección "Your apps", verifica tu Web app
3. Confirma que tu **API Key** es: `AIzaSyBVtu1KlEiA8HxPCoT9pSUIE3Pm2oBE2xA`

### Paso 4: Configurar API Key sin restricciones (para desarrollo)

1. Ve a: https://console.cloud.google.com/apis/credentials?project=delivery-go-fast
2. Busca tu API Key: `AIzaSyBVtu1KlEiA8HxPCoT9pSUIE3Pm2oBE2xA`
3. Click en editar (ícono de lápiz)
4. En "Application restrictions":
   - Selecciona: **"None"** (para desarrollo)
   - O asegúrate de que `delivery-go-fast.firebaseapp.com` y `localhost` estén autorizados
5. En "API restrictions":
   - Verifica que **"Identity Toolkit API"** esté habilitada
   - O selecciona "Don't restrict key" (para desarrollo)
6. Guarda los cambios

### Paso 5: ⚠️ IMPORTANTE - Configurar Dominios para reCAPTCHA

**Este es el paso más crítico que a menudo se olvida:**

1. Ve a: https://console.cloud.google.com/security/recaptcha?project=delivery-go-fast
2. En la lista de sitios reCAPTCHA, busca tu proyecto
3. Click en **el nombre del sitio** (o crea uno si no existe)
4. En la sección **"Dominios"**, agrega:
   - `localhost`
   - `127.0.0.1`
   - `delivery-go-fast.firebaseapp.com`
   - `*.firebaseapp.com` (opcional, para todos los subdominios)
5. Guarda los cambios

**Si NO existe un sitio reCAPTCHA, créalo:**

1. Click en **"+ Crear clave"**
2. Etiqueta: `delivery-go-fast`
3. Tipo de reCAPTCHA: **reCAPTCHA v2** (marca "No soy un robot")
4. Dominios: Agrega los dominios mencionados arriba
5. Click en **"Enviar"**

### Paso 6: Verificar la configuración de Firebase Auth en Google Cloud

1. Ve a: https://console.cloud.google.com/customer-identity/providers?project=delivery-go-fast
2. Verifica que **"Phone"** esté habilitado
3. Click en "Phone" y verifica la configuración

## ✅ SOLUCIÓN 2: Verificar SHA-1 y SHA-256 (Para Android)

Si estás probando en Android (emulador o dispositivo), necesitas configurar las huellas digitales:

### Paso 1: Obtener SHA-1 y SHA-256

**Para Debug (desarrollo):**

```bash
cd android
./gradlew signingReport
```

Busca en la salida:

```
Variant: debug
Config: debug
Store: C:\Users\TuUsuario\.android\debug.keystore
Alias: AndroidDebugKey
MD5: XX:XX:XX...
SHA1: AA:BB:CC:DD:EE... ← Copia este
SHA-256: 11:22:33:44:55... ← Copia este
```

**Alternativa con keytool:**

```bash
keytool -list -v -keystore C:\Users\TuUsuario\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
```

### Paso 2: Agregar SHA a Firebase

1. Ve a: https://console.firebase.google.com/project/delivery-go-fast/settings/general
2. Scroll hasta "Your apps"
3. Selecciona tu app Android
4. Click en "Add fingerprint"
5. Pega el **SHA-1** y guarda
6. Click en "Add fingerprint" nuevamente
7. Pega el **SHA-256** y guarda

## ✅ SOLUCIÓN 3: Usar Números de Teléfono de Prueba (Temporal)

Mientras configuras la producción, puedes usar números de prueba:

### Configurar en Firebase Console:

1. Ve a: https://console.firebase.google.com/project/delivery-go-fast/authentication/providers
2. Click en "Phone" en la lista de proveedores
3. Scroll hasta **"Phone numbers for testing"**
4. Agrega números de prueba:
   - Número: `+51927885314`
   - Código: `123456` (cualquier código de 6 dígitos)
5. Guarda

### Usar en tu app:

```typescript
// En el frontend, usa el número de prueba
const phoneNumber = "+51927885314";
await this.phoneAuthService.sendOTP(phoneNumber);

// Firebase NO enviará SMS real, usa el código configurado
const code = "123456"; // El código que configuraste en Console
await this.phoneAuthService.verifyOTP(code);
```

**Ventajas:**

- ✅ No consume cuota de SMS
- ✅ No requiere configuración adicional
- ✅ Funciona en emuladores sin Google Play Services
- ✅ Ideal para desarrollo y testing

**Desventajas:**

- ❌ Solo funciona con los números específicos que configures
- ❌ No apto para producción con usuarios reales

## ✅ SOLUCIÓN 4: Verificar Configuración de Identity Toolkit API

1. Ve a: https://console.cloud.google.com/apis/library/identitytoolkit.googleapis.com?project=delivery-go-fast
2. Verifica que **Identity Toolkit API** esté **HABILITADA**
3. Si no está habilitada, click en "ENABLE"

## 🧪 Prueba después de aplicar las soluciones

### Test 1: Ejecutar diagnóstico automático

1. Abre tu app en el navegador: `http://localhost:8100/phone-login`
2. Abre DevTools → Console (F12)
3. Deberías ver automáticamente el diagnóstico completo:

```
🔍 === FIREBASE DIAGNOSTICS ===

📋 1. Environment Configuration:
  ✓ API Key: AIzaSyBVtu1KlEiA8Hx...
  ✓ Auth Domain: delivery-go-fast.firebaseapp.com
  ✓ Project ID: delivery-go-fast
  ...

📋 2. Firebase Auth Instance:
  ✓ Auth initialized: YES
  ...

📋 6. Firebase API Connectivity:
  ✓ Identity Toolkit API status: 200
  ✅ API Key is valid and has access to Identity Toolkit
```

### Test 2: Verificar dominios autorizados

```bash
# Abre tu app en: http://localhost:8100
# Intenta enviar OTP
# Deberías ver el reCAPTCHA y luego el SMS enviarse
```

### Test 2: Verificar en consola del navegador

```javascript
// Abre DevTools → Console
// Ejecuta:
console.log("Firebase Config:", environment.firebase);
console.log("Auth Domain:", auth.app.options.authDomain);
```

### Test 3: Verificar API Key

```bash
# Intenta hacer una petición directa:
curl "https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=AIzaSyBVtu1KlEiA8HxPCoT9pSUIE3Pm2oBE2xA" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+51927885314",
    "recaptchaToken": "test"
  }'
```

Si obtienes error 400, la API Key necesita configuración.

## 📋 Checklist de Configuración

### Firebase Console

- [ ] Authentication → Settings → Authorized domains → `localhost` agregado
- [ ] Authentication → Sign-in method → Phone → Habilitado
- [ ] Settings → General → Web app configurada correctamente
- [ ] Settings → General → SHA-1 y SHA-256 agregados (Android)
- [ ] Authentication → Sign-in method → Phone → Test phone numbers (opcional)

### Google Cloud Console

- [ ] APIs & Services → Credentials → API Key sin restricciones (desarrollo)
- [ ] APIs & Services → Library → Identity Toolkit API habilitada

### Código

- [ ] `environment.ts` tiene la API Key correcta
- [ ] `firebase.ts` está inicializado correctamente
- [ ] reCAPTCHA container existe en HTML: `<div id="recaptcha-container"></div>`

## 🎯 Orden de Solución Recomendado

1. **PRIMERO**: Autorizar `localhost` en dominios (5 minutos)
2. **SEGUNDO**: Configurar API Key sin restricciones (5 minutos)
3. **TERCERO**: Agregar SHA-1/SHA-256 para Android (10 minutos)
4. **OPCIONAL**: Configurar números de prueba para desarrollo (5 minutos)

## 🚀 Resultado Esperado

Después de aplicar la Solución 1 y 2, deberías ver:

```
✅ reCAPTCHA resuelto
✅ OTP enviado correctamente. VerificationId: xxxxx
📱 SMS enviado a +51927885314
```

En lugar de:

```
❌ Error al enviar OTP: FirebaseError: Firebase: Error (auth/invalid-app-credential)
```

## 📚 Referencias

- [Firebase Phone Auth - Android](https://firebase.google.com/docs/auth/android/phone-auth)
- [Firebase Authorized Domains](https://firebase.google.com/docs/auth/web/redirect-best-practices#customize-domains)
- [Identity Toolkit API](https://cloud.google.com/identity-platform/docs/reference/rest)
- [SHA Fingerprint Configuration](https://developers.google.com/android/guides/client-auth)
