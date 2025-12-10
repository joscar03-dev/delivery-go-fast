# 🔧 Solución: Configurar Firebase App Check Correctamente

## 🎯 Tu Situación Actual (Firebase Console)

Navegaste a: **Build** → **App Check** y ves:

```
┌──────────────────────────────────────────────────────────┐
│ Apps                                                      │
│                                                           │
│ ✅ com.deliverygofast1.app (Android)                     │
│    Provider: Play Integrity                              │
│    Status: Registered                                    │
│                                                           │
│ ❌ App Web                                                │
│    Status: Not registered                                │
│                                                           │
│ ⚠️  Advertencia: Registra todas las apps para obtener   │
│    todos los beneficios de verificación                  │
└──────────────────────────────────────────────────────────┘
```

**Problema**: La app Android está registrada, pero el **Error 39** sigue apareciendo porque falta configurar **qué servicios de Firebase requieren App Check**.

---

## ✅ Solución Paso a Paso

### Paso 1: Configurar Firebase Authentication (CRÍTICO)

1. En Firebase Console, estás en: **Build** → **App Check**
2. Busca la pestaña superior: **APIs** (al lado de "Apps")
3. Click en tab **"APIs"**

```
┌──────────────────────────────────────────────────────────┐
│ [Apps]  [APIs] ← Click aquí                              │
└──────────────────────────────────────────────────────────┘
```

4. Verás una lista de servicios de Firebase:

```
┌──────────────────────────────────────────────────────────┐
│ APIs                                                      │
│                                                           │
│ ⚙️ Firebase Authentication                                │
│    Enforcement: Not configured                           │
│    [Configure]  ← Click aquí                             │
│                                                           │
│ ⚙️ Cloud Firestore                                        │
│    Enforcement: Not configured                           │
│                                                           │
│ ⚙️ Realtime Database                                      │
│    Enforcement: Not configured                           │
└──────────────────────────────────────────────────────────┘
```

5. Click en **"Configure"** de **Firebase Authentication**

6. Se abrirá un diálogo. Selecciona:

```
┌──────────────────────────────────────────────────────────┐
│ Configure Firebase Authentication                         │
│                                                           │
│ Enforcement:                                             │
│                                                           │
│ ● Monitoring (recommended)  ← Selecciona ESTO           │
│   Collect metrics but allow all requests                 │
│                                                           │
│ ○ Enforce                                                │
│   Block requests without valid App Check tokens          │
│                                                           │
│ [Cancel]  [Save]                                         │
└──────────────────────────────────────────────────────────┘
```

7. Click **"Save"**

**⏱️ IMPORTANTE**: Espera 5-10 minutos para que la configuración se propague.

---

### Paso 2: Verificar Estado de la App Android

Vuelve a la pestaña **"Apps"**:

1. Click en tu app: **com.deliverygofast1.app**
2. Verifica que diga:

```
┌──────────────────────────────────────────────────────────┐
│ com.deliverygofast1.app                                  │
│                                                           │
│ Provider: Play Integrity                                 │
│ Status: ✅ Registered                                    │
│                                                           │
│ Metrics: (aparecerán después de usar la app)            │
│                                                           │
│ ⚙️ Settings:                                              │
│    ○ Delete registration                                 │
└──────────────────────────────────────────────────────────┘
```

**✅ Si dice "Registered"**, la app está bien configurada.

---

### Paso 3: (Opcional) Registrar App Web

**⚠️ IMPORTANTE**: Solo necesitas esto si también usas Phone Auth en la **versión web** (navegador).

Si solo usas la app Android, **puedes ignorar** la advertencia de la app web.

#### Para registrar la app web (si la necesitas):

1. En la pestaña **"Apps"**, click **"Add app"**
2. Seleccionar: **Web**
3. Ingresar el nombre de tu app web
4. Provider: **reCAPTCHA v3**
5. Copiar la **Site Key** que te da Firebase
6. Agregar el código de reCAPTCHA v3 a tu app web

**Nota**: Como tu app principal es Android, esto es **opcional**.

---

## 🔍 Verificar Configuración Correcta

### Checklist Final:

```
✅ Firebase Console → App Check → Apps
   └─ com.deliverygofast1.app: Registered con Play Integrity

✅ Firebase Console → App Check → APIs
   └─ Firebase Authentication: Monitoring (no Enforce)

✅ Play Console → Integridad de la app
   └─ Proyecto de Cloud vinculado: delivery-go-fast

✅ Firebase Console → Project Settings → App Android
   └─ Huellas SHA-1 y SHA-256 agregadas (debug + release)
```

---

## 🧪 Probar la Solución

### 1. Generar nueva build con los cambios de MainApplication.java:

```powershell
cd c:\laragon\www\delivery-go-fast\delivery-frontend

# Build frontend
npm run build

# Sync
npx cap sync android

# Generar AAB
cd android
.\gradlew clean
.\gradlew bundleRelease
```

### 2. Subir AAB a Play Console:

- **Prueba interna** → Crear nuevo release
- Subir: `android/app/build/outputs/bundle/release/app-release.aab`
- Notas: "Fix Error 39: App Check configurado en Monitoring"

### 3. Instalar desde Play Store:

```powershell
# Desinstalar versión anterior
adb uninstall com.deliverygofast1.app

# Instalar desde Play Store (prueba interna)
# Los verificadores deben usar el enlace de prueba interna
```

### 4. Probar Phone Login:

**Prueba A: Usuario NO registrado**

1. Abrir app
2. Ir a Phone Login (sin registrarse)
3. Ingresar teléfono: `+51999888777`
4. **Resultado esperado**:
   - ✅ SMS llega correctamente (SIN Error 39)
   - ✅ Verificar código
   - ✅ Backend responde: "Usuario no encontrado"
   - ✅ Diálogo: "¿Deseas registrarte?"

**Prueba B: Usuario registrado**

1. Completar registro con el teléfono anterior
2. Cerrar sesión
3. Phone Login con el mismo teléfono
4. **Resultado esperado**:
   - ✅ SMS llega
   - ✅ Login exitoso directo

---

## 🔧 Troubleshooting

### Error 39 sigue apareciendo

**Causa 1: Configuración no propagada**

- ⏱️ Esperar 10-15 minutos después de cambiar a "Monitoring"
- Desinstalar e reinstalar la app

**Causa 2: Firebase Authentication no está en "Monitoring"**

```powershell
# Verificar en logs:
adb logcat -c
adb logcat | findstr /i "AppCheck|FirebaseAuth"
```

Busca:

- ✅ `App Check enforcement: MONITORING` → Correcto
- ❌ `App Check enforcement: ENFORCE` → Cambiar a Monitoring

**Causa 3: App instalada por USB (no desde Play)**

```powershell
adb shell dumpsys package com.deliverygofast1.app | findstr installerPackageName
```

- ✅ `installerPackageName=com.android.vending` → Correcto
- ❌ `installerPackageName=null` → Instalar desde Play

**Causa 4: Huellas SHA no coinciden**

```powershell
# En Firebase Console, verifica que tengas 4 huellas:
# - SHA-1 debug
# - SHA-256 debug
# - SHA-1 release (desde Play Console)
# - SHA-256 release (desde Play Console)
```

---

## 📊 Flujo Correcto (Con Monitoring)

```
┌─────────────────────────────────────────────────────────┐
│ 1. Usuario abre app e intenta Phone Login               │
│                                                          │
│ 2. MainApplication.java inicializa App Check            │
│    - Instala PlayIntegrityAppCheckProviderFactory       │
│                                                          │
│ 3. Usuario ingresa teléfono y envía OTP                 │
│                                                          │
│ 4. Firebase Auth solicita token a App Check             │
│    - App Check pide atestación a Play Integrity         │
│    - Play Integrity verifica:                           │
│      ✅ Huella SHA coincide                             │
│      ✅ App instalada desde Play Store                  │
│      ✅ Dispositivo tiene Play Services                 │
│    - Play Integrity devuelve token válido               │
│                                                          │
│ 5. Firebase Auth valida token con App Check             │
│    - Enforcement = Monitoring                           │
│    - Token válido ✅                                     │
│    - Permite continuar (incluso si usuario no existe)   │
│                                                          │
│ 6. Firebase envía SMS                                   │
│                                                          │
│ 7. Usuario verifica código                              │
│                                                          │
│ 8. Frontend envía firebaseToken al backend              │
│                                                          │
│ 9. Backend valida y responde:                           │
│    - Si usuario existe → Login exitoso                  │
│    - Si no existe → "Regístrate primero"                │
└─────────────────────────────────────────────────────────┘
```

---

## 📚 Diferencia Entre "Monitoring" y "Enforce"

| Aspecto                            | Monitoring    | Enforce     |
| ---------------------------------- | ------------- | ----------- |
| **Usuarios registrados**           | ✅ Permite    | ✅ Permite  |
| **Usuarios nuevos**                | ✅ Permite    | ❌ Error 39 |
| **Métricas**                       | ✅ Recopila   | ✅ Recopila |
| **Bloquea requests inválidos**     | ❌ No bloquea | ✅ Bloquea  |
| **Recomendado para apps públicas** | ✅ Sí         | ❌ No       |

**Tu caso**: Como permites registro público por teléfono, **debes usar "Monitoring"**.

---

## ✅ Resumen de la Solución

**Problema identificado**:

- App Check está configurado
- Pero Firebase Authentication requería tokens válidos (modo Enforce implícito)
- Usuarios nuevos no tienen token → Error 39

**Solución aplicada**:

1. ✅ Firebase Console → App Check → **APIs** (no Apps)
2. ✅ Configurar Firebase Authentication → **"Monitoring"**
3. ✅ Esperar propagación (5-10 min)
4. ✅ Subir nuevo AAB con MainApplication.java actualizado
5. ✅ Instalar desde Play Store
6. ✅ Probar Phone Login sin registro previo

**Resultado esperado**:

- ✅ SMS llega a usuarios nuevos
- ✅ Backend valida y pide registro si no existe
- ✅ Sin Error 39

**Tiempo total**: 15-20 minutos (incluye compilación y propagación).

---

## 🆘 Soporte

Si después de seguir estos pasos el error persiste:

1. Captura pantalla de:

   - Firebase Console → App Check → **APIs** → Firebase Authentication (estado)
   - Firebase Console → App Check → **Apps** → tu app (estado)

2. Captura logs:

```powershell
adb logcat -c
adb logcat > app_logs.txt
# Reproduce el error
# Detén el log (Ctrl+C)
```

3. Verifica instalación:

```powershell
adb shell dumpsys package com.deliverygofast1.app | findstr "installerPackageName|versionCode"
```

4. Comparte los resultados para diagnóstico detallado.

---

## 📖 Referencias

- [Firebase App Check - APIs Configuration](https://firebase.google.com/docs/app-check/custom-resource-backend)
- [Play Integrity API Setup](https://developer.android.com/google/play/integrity/setup)
- [Firebase Authentication with App Check](https://firebase.google.com/docs/app-check/android/default-providers)
