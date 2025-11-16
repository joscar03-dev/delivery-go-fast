# 🔐 Guía: Obtener Huellas SHA de Release de Google Play Console

## 📌 Situación Actual

- ✅ **Phone Auth funciona** (código nativo correcto)
- ❌ **Se abre navegador** porque Play Integrity falla
- ❓ **Causa**: Faltan huellas SHA del certificado de **RELEASE** de Google Play

## 🎯 Por Qué Sucede Esto

Cuando subes tu app a Google Play (aunque sea en prueba interna):

1. Google **elimina tu certificado de firma local**
2. Google **re-firma tu app** con su propio certificado
3. Firebase necesita conocer **las huellas SHA del certificado de Google**
4. Sin estas huellas, Play Integrity falla → se abre navegador con reCAPTCHA

## 📦 Paso 1: Subir App a Google Play Console

### Opción A: Si YA tienes la app en Play Console

✅ Salta al Paso 2

### Opción B: Si NO has subido la app aún

#### 1.1 Crear Cuenta de Desarrollador (Si no tienes)

- Ir a: https://play.google.com/console
- **Costo único**: $25 USD (una vez, para siempre)
- **No es suscripción**, es pago único

#### 1.2 Crear App en Play Console

```bash
# En tu proyecto
cd c:\laragon\www\delivery-go-fast\delivery-frontend

# Generar AAB de release
npx cap build android --release
```

#### 1.3 Configurar Firma (Automática por Google)

- En Play Console → Tu App → **Lanzamiento** → **Configuración** → **Integridad de la app**
- Google activa automáticamente "App Signing by Google Play"
- Esto es **obligatorio** para nuevas apps

#### 1.4 Subir AAB

- **Lanzamiento** → **Prueba interna** (más rápido)
- Subir el archivo: `android/app/build/outputs/bundle/release/app-release.aab`
- Completar información básica (nombre, descripción, capturas)
- **No necesitas publicar en producción**, prueba interna es suficiente

## 🔍 Paso 2: Obtener Huellas SHA de Google Play

### 2.1 Ir a Integridad de la App

1. Abre Google Play Console: https://play.google.com/console
2. Selecciona tu app: **Delivery Go Fast**
3. Menú izquierdo → **Lanzamiento** → **Configuración** → **Integridad de la app**

### 2.2 Copiar Huellas del Certificado de FIRMA

Verás DOS secciones:

```
┌─────────────────────────────────────────┐
│ 📱 Certificado de firma de la app      │ ← ESTE ES EL CORRECTO
│                                          │
│ SHA-1:  XX:XX:XX:XX...                  │ ← Copiar esta
│ SHA-256: YY:YY:YY:YY...                 │ ← Copiar esta
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 📤 Certificado de carga                 │ ← NO USAR ESTE
│                                          │
│ SHA-1:  ZZ:ZZ:ZZ:ZZ...                  │ ← Ignorar
│ SHA-256: WW:WW:WW:WW...                 │ ← Ignorar
└─────────────────────────────────────────┘
```

**⚠️ IMPORTANTE**: Usa las del **"Certificado de firma de la app"**, NO las del certificado de carga.

### 2.3 Ejemplo Real

Las huellas se ven así:

```
SHA-1:   3B:0C:12:D4:E5:F6:A7:B8:C9:D0:E1:F2:03:14:25:36:47:58:69:7A
SHA-256: 4C:1D:23:E5:F7:08:19:2A:3B:4C:5D:6E:7F:80:91:A2:B3:C4:D5:E6:F7:08:19:2A:3B:4C:5D:6E:7F:80:91:A2
```

## 🔥 Paso 3: Agregar Huellas a Firebase

### 3.1 Ir a Firebase Console

1. Abre: https://console.firebase.google.com
2. Selecciona proyecto: **delivery-go-fast**
3. Ícono ⚙️ (Settings) → **Configuración del proyecto**

### 3.2 Seleccionar App Android

- Desplázate a la sección **"Tus aplicaciones"**
- Encuentra: **com.deliverygofast1.app** (Android)

### 3.3 Agregar Huellas Digitales

```
┌─────────────────────────────────────────────────┐
│ SHA certificate fingerprints                     │
│                                                   │
│ Huella SHA-1 (DEBUG)        ✅ Ya agregada      │
│ Huella SHA-256 (DEBUG)      ✅ Ya agregada      │
│                                                   │
│ [+ Agregar huella digital]  ← Click aquí        │
└─────────────────────────────────────────────────┘
```

1. Click en **"+ Agregar huella digital"**
2. Pegar el **SHA-1 de Google Play** (del Paso 2.2)
3. Guardar
4. Click nuevamente en **"+ Agregar huella digital"**
5. Pegar el **SHA-256 de Google Play**
6. Guardar

### 3.4 Verificar Configuración Final

Deberías tener **4 huellas en total**:

| Huella            | Entorno    | Origen                        |
| ----------------- | ---------- | ----------------------------- |
| SHA-1 (DEBUG)     | Desarrollo | Local (gradlew signingReport) |
| SHA-256 (DEBUG)   | Desarrollo | Local (gradlew signingReport) |
| SHA-1 (RELEASE)   | Producción | Google Play Console           |
| SHA-256 (RELEASE) | Producción | Google Play Console           |

## 🔗 Paso 4: Vincular Play Integrity API

### 4.1 Vincular Proyecto de Cloud

En la misma página de Play Console (Integridad de la app):

1. Busca la sección **"API Play Integrity"**
2. Click en **"Vincular proyecto de Cloud"**
3. Selecciona: **delivery-go-fast** (tu proyecto de Firebase)
4. Confirmar vinculación

### 4.2 Verificar API Habilitada

1. Ir a Google Cloud Console: https://console.cloud.google.com
2. Asegúrate de estar en el proyecto: **delivery-go-fast**
3. Menú → **APIs y servicios** → **Biblioteca**
4. Buscar: "Play Integrity API"
5. Verificar que diga: **"API habilitada"** ✅

## 🛡️ Paso 5: Habilitar Firebase App Check

### 5.1 Configurar App Check en Firebase

1. Firebase Console → **Build** → **App Check**
2. Click en tu app Android: **com.deliverygofast1.app**
3. Click en **"Play Integrity"** como proveedor
4. Guardar

### 5.2 Inicializar App Check en MainActivity

Tu archivo `MainActivity.java` ya tiene esto:

```java
// Inicializar App Check con Play Integrity
FirebaseAppCheck firebaseAppCheck = FirebaseAppCheck.getInstance();
firebaseAppCheck.installAppCheckProviderFactory(
    PlayIntegrityAppCheckProviderFactory.getInstance()
);
```

✅ **Ya está configurado correctamente**

## ✅ Paso 6: Probar la App

### 6.1 Generar Nueva Build

```bash
cd c:\laragon\www\delivery-go-fast\delivery-frontend

# Sync cambios de Firebase
npx cap sync android

# Compilar
npm run build

# Generar APK de release firmado
npx cap build android --release
```

### 6.2 Subir a Play Console (Prueba Interna)

1. Subir el nuevo AAB/APK
2. Google lo re-firmará con su certificado (que ya agregaste a Firebase)

### 6.3 Descargar e Instalar

1. Desde tu dispositivo Android
2. Ir a Play Console → enlace de prueba interna
3. Instalar la app **desde Play Store** (no desde USB)
4. **Importante**: Debe instalarse desde Play Store para que tenga la firma de Google

### 6.4 Probar Phone Auth

1. Abrir app
2. Ingresar número de teléfono
3. **Resultado esperado**:
   - ✅ NO se abre navegador
   - ✅ SMS llega automáticamente
   - ✅ Verificación silenciosa con Play Integrity

## 🐛 Solución de Problemas

### Problema: Sigue abriendo navegador

**Posibles causas:**

1. ❌ Huellas SHA incorrectas en Firebase
2. ❌ App instalada desde USB (no desde Play Store)
3. ❌ Play Integrity API no vinculada
4. ❌ Dispositivo sin Google Play Services

**Solución:**

```bash
# Verificar que la app tenga la firma correcta
adb shell dumpsys package com.deliverygofast1.app | grep signatures
```

### Problema: Error "app not authorized"

**Causa**: Huellas SHA no coinciden

**Solución:**

1. Verificar que las huellas en Firebase sean exactamente las de Play Console
2. Esperar 5-10 minutos para que Firebase propague los cambios

### Problema: Firebase blocking requests

**Causa**: Protección anti-abuso durante desarrollo

**Solución Temporal:**

1. Firebase Console → **Authentication** → **Sign-in method**
2. Tab: **Phone**
3. Agregar números de prueba:

```
+51927885314 → 123456
```

## 📊 Resumen de Costos

| Servicio              | Costo                              |
| --------------------- | ---------------------------------- |
| Firebase (Blaze)      | Gratis (cuota generosa)            |
| Google Cloud          | Gratis (mismo que Firebase)        |
| Google Play Developer | **$25 USD una vez** (para siempre) |
| Play Integrity API    | Gratis                             |
| App Check             | Gratis                             |

**Total**: $25 USD (pago único, no mensual)

## 🎯 Flujo Correcto

```
┌────────────────────────────────────────────────────┐
│ 1. Usuario ingresa teléfono                        │
│ 2. App llama a signInWithPhoneNumber (nativo)      │
│ 3. SDK nativo intenta Play Integrity               │
│    ├─ Verifica huella SHA de la app                │
│    ├─ Consulta Google Play Services                │
│    └─ Valida que sea app auténtica                 │
│ 4. ✅ Play Integrity ÉXITO                         │
│ 5. Firebase envía SMS automáticamente              │
│ 6. Usuario ingresa código                          │
│ 7. ✅ Login exitoso SIN navegador                  │
└────────────────────────────────────────────────────┘
```

## 📚 Referencias

- [Play Integrity API](https://developer.android.com/google/play/integrity)
- [Firebase App Check](https://firebase.google.com/docs/app-check)
- [Phone Auth Android](https://firebase.google.com/docs/auth/android/phone-auth)

## ✅ Checklist Final

- [ ] App subida a Google Play Console (prueba interna)
- [ ] Huellas SHA-1 y SHA-256 de Google Play copiadas
- [ ] 4 huellas agregadas a Firebase (2 debug + 2 release)
- [ ] Play Integrity API vinculada en Play Console
- [ ] App Check habilitado en Firebase Console
- [ ] Nueva build generada y subida a Play Console
- [ ] App instalada desde Play Store (no USB)
- [ ] Phone auth probado → ✅ Sin navegador

---

**Nota Final**: El paso crítico es instalar la app **desde Play Store** (aunque sea prueba interna), porque solo así tendrá la firma de Google que coincide con las huellas SHA que agregaste a Firebase.
