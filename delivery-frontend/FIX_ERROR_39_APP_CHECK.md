# 🔧 Solución: Error Code 39 en Firebase Authentication

## 🎯 Problema

```
Error: An internal error has occurred. [ Error code:39]
```

**Causa raíz**: Firebase App Check no está inicializado o configurado correctamente con Play Integrity API.

## ✅ Solución Completa (3 pasos)

### Paso 1: Código Android (✅ YA COMPLETADO)

#### 1.1 Dependencia en `build.gradle`

Ya agregada en `android/app/build.gradle`:

```groovy
dependencies {
    // ... otras dependencias ...
    implementation 'com.google.firebase:firebase-appcheck-playintegrity'
}
```

#### 1.2 Inicialización en `MainApplication.java`

Ya actualizado en `android/app/src/main/java/com/deliverygofast1/app/MainApplication.java`:

```java
import com.google.firebase.appcheck.FirebaseAppCheck;
import com.google.firebase.appcheck.playintegrity.PlayIntegrityAppCheckProviderFactory;

@Override
public void onCreate() {
    super.onCreate();

    // Inicializar Firebase
    FirebaseApp.initializeApp(this);

    // ✅ Inicializar App Check con Play Integrity
    FirebaseAppCheck firebaseAppCheck = FirebaseAppCheck.getInstance();
    firebaseAppCheck.installAppCheckProviderFactory(
        PlayIntegrityAppCheckProviderFactory.getInstance()
    );
}
```

---

### Paso 2: Configurar en Firebase Console (🔴 CRÍTICO)

#### 2.1 Habilitar App Check

1. Ir a: https://console.firebase.google.com
2. Seleccionar proyecto: **delivery-go-fast**
3. Menú lateral → **Build** → **App Check**
4. Click en la tab **"Apps"**
5. Buscar tu app Android: **com.deliverygofast1.app**

#### 2.2 Registrar la App con Play Integrity

```
┌────────────────────────────────────────────────┐
│ Apps                                            │
│                                                 │
│ ☐ com.deliverygofast1.app (Android)            │
│   Status: Not registered                       │
│   [Register app]  ← Click aquí                 │
└────────────────────────────────────────────────┘
```

6. Click en **"Register app"**
7. Se abrirá un diálogo: **"Register your app with App Check"**

#### 2.3 Configurar Play Integrity Provider

```
┌──────────────────────────────────────────────────┐
│ Register app with App Check                      │
│                                                   │
│ Select provider:                                 │
│ ○ SafetyNet (deprecated)                         │
│ ● Play Integrity (recommended) ← Selecciona     │
│ ○ reCAPTCHA v3                                   │
│ ○ Custom provider                                │
│                                                   │
│ [Next]                                           │
└──────────────────────────────────────────────────┘
```

8. Click **"Next"**
9. Confirma el package name: `com.deliverygofast1.app`
10. Click **"Register"**

#### 2.4 Configurar Enforcement Mode (IMPORTANTE)

Después de registrar:

```
┌────────────────────────────────────────────────┐
│ Enforcement                                     │
│                                                 │
│ ○ Monitoring (recommended for new apps)        │
│   Collect metrics but don't block requests     │
│                                                 │
│ ● Enforce protection (Enforcement) ← Cambiar   │
│   Block requests without valid tokens          │
│                                                 │
│ [Save]                                          │
└────────────────────────────────────────────────┘
```

**⚠️ IMPORTANTE**:

- **Primera vez**: Selecciona **"Monitoring"** (para ver métricas sin bloquear).
- Después de confirmar que funciona: Cambia a **"Enforce protection"**.

---

### Paso 3: Configurar Play Console (Vincular APIs)

#### 3.1 Vincular Proyecto de Cloud

1. Ir a: https://play.google.com/console
2. Seleccionar tu app: **Delivery Go Fast**
3. Menú izquierdo → **Lanzamiento** → **Configuración** → **Integridad de la app**
4. Buscar sección: **"API Play Integrity"**
5. Click en **"Vincular proyecto de Cloud"**
6. Seleccionar: **delivery-go-fast** (tu proyecto de Firebase)
7. Click **"Vincular"**

#### 3.2 Verificar API Habilitada

1. Ir a: https://console.cloud.google.com
2. Verificar que estés en el proyecto: **delivery-go-fast**
3. Menú → **APIs y servicios** → **Biblioteca**
4. Buscar: **"Play Integrity API"**
5. Verificar estado: **"API habilitada"** ✅
   - Si no está habilitada, click en **"Habilitar"**

---

## 🔄 Pasos de Implementación

### 1. Compilar y Generar AAB

```powershell
cd c:\laragon\www\delivery-go-fast\delivery-frontend

# Build del frontend
npm run build

# Sincronizar cambios (ya hecho)
npx cap sync android

# Generar AAB de release
cd android
.\gradlew bundleRelease
```

### 2. Subir a Play Console

1. El AAB estará en: `android/app/build/outputs/bundle/release/app-release.aab`
2. Play Console → Lanzamiento → Prueba interna
3. **Crear nuevo release** y subir el AAB actualizado
4. Agregar notas del release: "Fix: Error 39 - App Check inicializado"
5. Click **"Guardar"** y luego **"Revisar release"**
6. Click **"Iniciar implementación en prueba interna"**

### 3. Esperar Propagación

- ⏱️ **Tiempo**: 5–15 minutos
- Play Console procesará el AAB
- Firebase propagará la configuración de App Check

### 4. Instalar desde Play Store

**⚠️ CRÍTICO**: Los verificadores deben:

1. **Desinstalar** la app anterior completamente
2. Ir al enlace de prueba interna
3. **Instalar desde Play Store** (no por USB/adb)
4. Verificar instalación:
   ```powershell
   adb shell dumpsys package com.deliverygofast1.app | findstr installerPackageName
   # Debe mostrar: installerPackageName=com.android.vending
   ```

---

## 🧪 Verificación y Pruebas

### Probar Phone Authentication

1. Abrir la app (instalada desde Play)
2. Ir a login con teléfono
3. Ingresar número: `+51927885314`
4. **Resultado esperado**:
   - ✅ NO se abre navegador
   - ✅ NO aparece reCAPTCHA
   - ✅ SMS llega automáticamente
   - ✅ Login exitoso

### Si sigue fallando: Capturar logs

```powershell
# Limpiar logs
adb logcat -c

# Capturar logs mientras reproduces el error
adb logcat | findstr /i "FirebaseAuth|AppCheck|PlayIntegrity|Error|Exception"
```

Busca en los logs:

- ✅ `Firebase App Check initialized`
- ✅ `Play Integrity provider installed`
- ❌ Si ves: `AppCheck token is invalid` → Verifica Firebase Console
- ❌ Si ves: `Play Integrity attestation failed` → Verifica vinculación en Play Console

---

## 📊 Checklist Final

### Código (Backend)

- [x] Dependencia `firebase-appcheck-playintegrity` en `build.gradle`
- [x] Inicialización en `MainApplication.java`
- [x] Sincronización con `npx cap sync android`

### Firebase Console

- [ ] App Check habilitado para `com.deliverygofast1.app`
- [ ] Provider configurado: **Play Integrity**
- [ ] Enforcement mode: **Monitoring** (inicialmente)
- [ ] Huellas SHA-1 y SHA-256 agregadas (debug + release)

### Play Console

- [ ] Proyecto de Cloud vinculado en Integridad de la app
- [ ] Play Integrity API habilitada
- [ ] Nuevo release AAB subido
- [ ] Verificadores tienen acceso

### Google Cloud Console

- [ ] Play Integrity API habilitada
- [ ] Proyecto: **delivery-go-fast** seleccionado

### Instalación

- [ ] App desinstalada completamente
- [ ] Reinstalada desde Play Store (prueba interna)
- [ ] `installerPackageName=com.android.vending` verificado

### Pruebas

- [ ] Phone login sin navegador
- [ ] SMS llega automáticamente
- [ ] Login exitoso sin error 39

---

## 🔍 Diagnóstico de Problemas

### Error persiste después de seguir todos los pasos

#### Problema 1: App Check no registrada

**Síntoma**: Error 39 sigue apareciendo
**Verificación**:

- Firebase Console → App Check → Apps
- Verificar que la app aparezca como "Registered" con Play Integrity

**Solución**:

- Re-registrar la app con Play Integrity
- Esperar 10 minutos para propagación

#### Problema 2: App instalada por USB

**Síntoma**: Error 39 solo en producción
**Verificación**:

```powershell
adb shell dumpsys package com.deliverygofast1.app | findstr installerPackageName
```

- Si muestra `null` → instalada por USB/IDE

**Solución**:

- Desinstalar completamente
- Reinstalar desde Play Store (enlace de prueba interna)

#### Problema 3: Huellas SHA no coinciden

**Síntoma**: Error "app not authorized" antes del error 39
**Verificación**:

- Firebase Console → Huellas agregadas
- Play Console → Certificado de firma (copiar SHA-1/SHA-256)

**Solución**:

- Verificar que las huellas de Play Console estén en Firebase
- Esperar 5–10 minutos tras añadirlas

#### Problema 4: Play Integrity API no vinculada

**Síntoma**: Error 39 en todos los dispositivos
**Verificación**:

- Play Console → Integridad de la app → Play Integrity API
- Debe mostrar: "Proyecto vinculado: delivery-go-fast"

**Solución**:

- Vincular proyecto de Cloud
- Habilitar Play Integrity API en Google Cloud Console
- Esperar 15 minutos para propagación

---

## 📚 Referencias Técnicas

### Error Code 39

- **Código interno**: `INTERNAL_ERROR` (39)
- **Causa común**: App Check no configurado o Play Integrity falla
- **Documentación**: [Firebase App Check](https://firebase.google.com/docs/app-check)

### Play Integrity API

- **Propósito**: Verificar autenticidad de la app y dispositivo
- **Reemplaza**: SafetyNet (deprecated)
- **Requisitos**:
  - App firmada por Google Play
  - Huellas SHA en Firebase
  - API vinculada en Play Console

### App Check Flow

```
┌──────────────────────────────────────────────────┐
│ 1. App inicia Phone Auth                         │
│ 2. App Check solicita token a Play Integrity     │
│ 3. Play Integrity verifica:                      │
│    - Huella SHA coincide con Firebase            │
│    - App instalada desde Play Store              │
│    - Dispositivo tiene Play Services             │
│ 4. Play Integrity devuelve token válido          │
│ 5. Firebase valida token con App Check           │
│ 6. Si es válido → envía SMS sin reCAPTCHA        │
│ 7. Si falla → Error 39                           │
└──────────────────────────────────────────────────┘
```

---

## ✅ Resumen Ejecutivo

**Problema**: Error 39 en Firebase Phone Authentication.

**Causa**: App Check no inicializado con Play Integrity.

**Solución aplicada**:

1. ✅ Agregada dependencia `firebase-appcheck-playintegrity`
2. ✅ Inicializado en `MainApplication.java`
3. 🔴 **PENDIENTE**: Configurar en Firebase Console (App Check → Register app → Play Integrity)
4. 🔴 **PENDIENTE**: Vincular Play Integrity API en Play Console
5. 🔴 **PENDIENTE**: Subir nuevo AAB a Play Console
6. 🔴 **PENDIENTE**: Instalar desde Play Store (no USB)

**Próximos pasos**:

1. Compilar nuevo AAB con los cambios
2. Configurar App Check en Firebase Console
3. Subir AAB a Play Console (prueba interna)
4. Los verificadores deben desinstalar e instalar desde Play
5. Probar Phone Authentication → ✅ Sin error 39

**Tiempo estimado**: 30–45 minutos (incluye propagación).

---

## 🆘 Soporte

Si después de seguir todos los pasos el error persiste:

1. Captura logs completos:

```powershell
adb logcat -d > app_logs.txt
```

2. Captura pantalla de:

   - Firebase Console → App Check (estado de la app)
   - Play Console → Integridad de la app (vinculación)
   - Error exacto que aparece

3. Verifica configuración:

```powershell
# Verificar package name
adb shell dumpsys package com.deliverygofast1.app | findstr packageName

# Verificar instalador
adb shell dumpsys package com.deliverygofast1.app | findstr installerPackageName

# Verificar versión instalada
adb shell dumpsys package com.deliverygofast1.app | findstr versionCode
```

4. Comparte los resultados para diagnóstico detallado.
