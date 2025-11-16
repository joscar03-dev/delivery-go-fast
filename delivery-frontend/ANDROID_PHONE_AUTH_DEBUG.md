# 🔧 Debug: Phone Authentication en Android

## 🔍 Problema actual

- El navegador se abre en lugar de usar el flujo nativo
- reCAPTCHA aparece cuando debería usar Play Integrity
- Los códigos OTP no validan correctamente

## ✅ Verificaciones necesarias

### 1. **Verificar que firebase-auth esté en build.gradle**

```groovy
// android/app/build.gradle
dependencies {
    implementation platform('com.google.firebase:firebase-bom:34.5.0')
    implementation 'com.google.firebase:firebase-analytics'
    implementation 'com.google.firebase:firebase-messaging'
    implementation 'com.google.firebase:firebase-auth'  // ✅ DEBE ESTAR
}
```

### 2. **Verificar MainApplication en AndroidManifest.xml**

```xml
<application
    android:name=".MainApplication"  <!-- ✅ DEBE ESTAR -->
    ...
</application>
```

### 3. **Verificar logs en Android Studio Logcat**

**Filtros importantes:**

```
FirebaseApp
FirebaseAuth
MainApplication
PhoneAuthService
capacitor-firebase
```

**Logs esperados:**

```
✅ Firebase inicializado en Application.onCreate()
✅ PhoneAuthService initialized
📱 Platform: Native (Android/iOS)
📱 Usando método NATIVO (Play Integrity/APNs)
```

**Logs INCORRECTOS (indican problema):**

```
❌ 📱 Platform: Web/PWA
❌ 🌐 Usando método WEB (reCAPTCHA)
```

### 4. **Verificar detección de plataforma**

Agrega este log temporal en `phone-login.page.ts`:

```typescript
import { Platform } from '@ionic/angular';

constructor(
  private platform: Platform,
  // ... otros servicios
) {
  console.log('🔍 PLATFORM DEBUG:');
  console.log('is capacitor:', this.platform.is('capacitor'));
  console.log('is android:', this.platform.is('android'));
  console.log('is ios:', this.platform.is('ios'));
  console.log('is mobile:', this.platform.is('mobile'));
  console.log('platforms:', this.platform.platforms());
}
```

**Resultado esperado en Android:**

```
is capacitor: true
is android: true
platforms: ["capacitor", "android", "mobile"]
```

### 5. **Verificar que NO se inicialice reCAPTCHA**

Si ves en Logcat:

```
✅ reCAPTCHA inicializado (Web)
```

Significa que está usando el flujo web. En apps nativas **NO debe aparecer este mensaje**.

### 6. **Verificar google-services.json**

```bash
# Verificar que existe
ls android/app/google-services.json

# Verificar package_name
cat android/app/google-services.json | grep package_name
# Debe ser: "package_name": "com.deliverygofast1.app"
```

### 7. **Verificar SHA fingerprints en Firebase Console**

```bash
cd android
./gradlew signingReport
```

Copia SHA-1 y SHA-256 y verifica que estén en:

- Firebase Console → Project Settings → Android app → Add fingerprint

## 🚀 Pasos para resolver

### Paso 1: Limpia completamente el proyecto

```bash
cd android
./gradlew clean
cd ..
npx cap sync android
```

### Paso 2: En Android Studio

1. **File → Invalidate Caches / Restart** → Invalidate and Restart
2. **Build → Clean Project**
3. **Build → Rebuild Project**

### Paso 3: Verifica en Logcat durante la ejecución

1. Conecta dispositivo físico (USB debugging)
2. Run app
3. Ve a Logcat y filtra por "PhoneAuth"
4. Intenta enviar código y captura todos los logs

### Paso 4: Si sigue abriendo navegador

Significa que el plugin está usando `signInWithRedirect` en lugar de nativo. Verifica:

```typescript
// phone-auth.service.ts
console.log("🔍 isNativeApp:", this.isNativeApp);
console.log("🔍 Platform capacitor:", this.platform.is("capacitor"));
```

Si ambos son `false`, el problema está en la detección de plataforma.

## 🆘 Solución temporal: Forzar modo nativo

Si necesitas probar rápidamente, en `phone-auth.service.ts`:

```typescript
constructor(private auth: Auth, private platform: Platform) {
  // TEMPORAL: Forzar modo nativo
  this.isNativeApp = true; // ⚠️ Solo para testing
  console.log('🔥 PhoneAuthService initialized');
  console.log('📱 Platform:', this.isNativeApp ? 'Native (Android/iOS)' : 'Web/PWA');
}
```

**NOTA:** Esto romperá la web, solo úsalo para confirmar que el método nativo funciona.

## 📊 Checklist de verificación

- [ ] `firebase-auth` en build.gradle
- [ ] `MainApplication` en AndroidManifest.xml
- [ ] SHA-1 y SHA-256 en Firebase Console
- [ ] google-services.json con package correcto
- [ ] Logcat muestra "Native (Android/iOS)"
- [ ] Logcat NO muestra "reCAPTCHA inicializado"
- [ ] Clean + Rebuild en Android Studio
- [ ] Prueba en dispositivo físico (no emulador)

## 🎯 Resultado esperado

Cuando funcione correctamente:

1. **NO se abre navegador**
2. **NO aparece reCAPTCHA**
3. Llega SMS al teléfono
4. Al ingresar código, valida correctamente
5. Logs muestran "método NATIVO"
