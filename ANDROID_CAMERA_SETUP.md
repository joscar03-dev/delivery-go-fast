# 🤖 Configuración Android - Carga de Fotos

## ✅ Configuración Completada

Se han configurado todos los permisos necesarios para que la funcionalidad de carga de fotos funcione correctamente en Android.

---

## 📋 Permisos Agregados

### En `AndroidManifest.xml`:

```xml
<!-- Camera and Storage Permissions for Photo Upload -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
    android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
    android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />

<!-- Camera feature (optional) -->
<uses-feature android:name="android.hardware.camera" android:required="false" />
<uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />
```

### Descripción de Permisos:

| Permiso                  | Propósito                    | Android Version       |
| ------------------------ | ---------------------------- | --------------------- |
| `CAMERA`                 | Capturar fotos con la cámara | Todas                 |
| `READ_EXTERNAL_STORAGE`  | Leer fotos de galería        | ≤ Android 12 (API 32) |
| `WRITE_EXTERNAL_STORAGE` | Guardar fotos temporales     | ≤ Android 12 (API 32) |
| `READ_MEDIA_IMAGES`      | Leer fotos de galería        | ≥ Android 13 (API 33) |

### ¿Por qué `android:required="false"` en camera feature?

- Permite que la app funcione en dispositivos sin cámara (tablets, emuladores)
- Los usuarios aún pueden seleccionar fotos de la galería
- La app no será filtrada en Play Store por falta de cámara

---

## 📱 Plugins de Capacitor Detectados

```
✓ @capacitor/camera@7.0.2 ← Plugin de cámara instalado
✓ @capacitor/app@7.1.0
✓ @capacitor/geolocation@7.1.5
✓ @capacitor/haptics@7.0.2
✓ @capacitor/keyboard@7.0.3
✓ @capacitor/push-notifications@7.0.3
✓ @capacitor/status-bar@7.0.3
```

---

## 🚀 Cómo Abrir y Probar en Android

### Opción 1: Android Studio (Recomendado)

```bash
cd delivery-frontend
npx cap open android
```

**Pasos:**

1. Android Studio se abrirá automáticamente
2. Espera a que Gradle sincronice (primera vez puede tardar)
3. Conecta tu dispositivo Android vía USB o inicia un emulador
4. Habilita "Depuración USB" en tu dispositivo (Ajustes > Opciones de desarrollador)
5. Click en el botón ▶️ "Run" o presiona Shift+F10

### Opción 2: Línea de Comandos

```bash
cd delivery-frontend

# Compilar el APK
cd android
./gradlew assembleDebug

# Instalar en dispositivo conectado
adb install app/build/outputs/apk/debug/app-debug.apk
```

---

## 🧪 Probar la Funcionalidad de Fotos

### 1. **Ir a Solicitud de Conductor**

- Iniciar sesión con una cuenta de cliente
- Navegar a: Perfil → "Solicitar ser Conductor"
- Completar Paso 1 y enviar

### 2. **Admin Aprueba Llamada**

- Iniciar sesión como super_admin en otro dispositivo/navegador
- Ir a Panel Admin → Solicitudes de Conductores
- Aprobar la llamada del usuario

### 3. **Completar Paso 2 con Fotos**

- Volver a la app del usuario
- Completar Paso 2
- **Probar cada sección de fotos:**

#### a) Foto del DNI

- Tap en placeholder
- Seleccionar "Tomar Foto" → Verificar que abre la cámara
- Tomar foto → Verificar vista previa
- Tap en foto → Verificar overlay con botones
- Tap "Eliminar" → Confirmar que desaparece
- Tap placeholder → Seleccionar "Elegir de Galería"
- Seleccionar foto de galería → Verificar carga

#### b) Licencia Frente

- Repetir proceso anterior

#### c) Licencia Reverso (Opcional)

- Verificar que funciona pero no es obligatorio

#### d) Foto del Vehículo

- Repetir proceso anterior

### 4. **Validaciones**

- Intentar enviar sin fotos obligatorias → Debe mostrar error
- Guardar borrador con fotos → Verificar que persisten al recargar
- Enviar solicitud completa → Verificar que se envía correctamente

### 5. **Verificar en Admin Panel**

- Ir a detalle de la solicitud
- Verificar que las fotos se muestran correctamente
- Verificar que se puede hacer click en las fotos (zoom futuro)

---

## 🔒 Flujo de Permisos en Android

### Primera Vez que Usuario Toca el Botón de Foto:

**Android mostrará diálogo:**

```
"Delivery Go Fast" quiere acceder a:
├─ Tu cámara
└─ Tus fotos y videos

[DENEGAR] [PERMITIR]
```

### Si Usuario Deniega Permisos:

**El componente mostrará error:**

```javascript
Error: "No se pudo capturar la foto. Por favor, intenta de nuevo.";
```

**Solución para el usuario:**

1. Ir a Configuración → Apps → Delivery Go Fast
2. Permisos → Cámara / Archivos y multimedia
3. Cambiar a "Permitir"

---

## 🐛 Solución de Problemas Android

### Error: "EACCES: permission denied"

**Causa**: Permisos no configurados correctamente
**Solución**:

```bash
npx cap sync android
npx cap open android
# Limpiar y reconstruir en Android Studio
```

### Error: "Camera not available"

**Causa**: Emulador sin cámara configurada
**Solución en Android Studio**:

1. AVD Manager → Edit emulator
2. Advanced Settings → Camera
3. Front/Back: Webcam0 o Emulated

### Error: "FileProvider not found"

**Causa**: file_paths.xml no existe o mal configurado
**Solución**: Ya está configurado en `android/app/src/main/res/xml/file_paths.xml`

### Fotos no aparecen en galería

**Causa**: Android 13+ requiere READ_MEDIA_IMAGES
**Solución**: Ya agregado en manifest

### App crashea al abrir cámara

**Causa**: Permiso de cámara no solicitado en runtime
**Solución**: Capacitor Camera maneja esto automáticamente

---

## 📊 Estructura de Archivos Android Modificados

```
android/
├── app/
│   ├── src/
│   │   └── main/
│   │       ├── AndroidManifest.xml ✅ Permisos agregados
│   │       └── res/
│   │           ├── values/
│   │           │   └── strings.xml ✅ Descripciones agregadas
│   │           └── xml/
│   │               └── file_paths.xml ✅ Ya existía
│   └── build.gradle ✓ No requiere cambios
└── capacitor.build.gradle ✓ Auto-generado
```

---

## 🔄 Comandos Útiles

### Reconstruir y Sincronizar:

```bash
cd delivery-frontend
npm run build                  # Compilar frontend
npx cap sync android          # Sincronizar con Android
npx cap open android          # Abrir Android Studio
```

### Limpiar Caché de Android:

```bash
cd android
./gradlew clean
./gradlew build
```

### Ver Logs en Tiempo Real:

```bash
adb logcat | grep "Capacitor"
adb logcat | grep "Camera"
```

### Desinstalar y Reinstalar App:

```bash
adb uninstall com.deliverygofast1.app
adb install app/build/outputs/apk/debug/app-debug.apk
```

---

## 🎯 Checklist de Pruebas Android

- [ ] App se instala correctamente
- [ ] Solicita permisos de cámara al primer uso
- [ ] Solicita permisos de galería al elegir fotos
- [ ] Cámara se abre y captura foto
- [ ] Galería se abre y permite seleccionar foto
- [ ] Vista previa de foto se muestra correctamente
- [ ] Botón eliminar funciona
- [ ] Fotos persisten al guardar borrador
- [ ] Validación de fotos obligatorias funciona
- [ ] Fotos se envían al backend correctamente
- [ ] Admin puede ver fotos en panel de detalle
- [ ] App no crashea al denegar permisos
- [ ] Funciona en Android 11, 12, 13, 14

---

## 📱 Versiones de Android Soportadas

| Android Version | API Level | Estado       | Notas                 |
| --------------- | --------- | ------------ | --------------------- |
| Android 14      | API 34    | ✅ Soportado | READ_MEDIA_IMAGES     |
| Android 13      | API 33    | ✅ Soportado | Nuevos permisos media |
| Android 12      | API 32    | ✅ Soportado | Transición permisos   |
| Android 11      | API 30    | ✅ Soportado | Scoped Storage        |
| Android 10      | API 29    | ✅ Soportado |                       |
| Android 9       | API 28    | ✅ Soportado |                       |
| Android 8       | API 26-27 | ✅ Soportado | Requiere FileProvider |
| Android 7       | API 24-25 | ⚠️ Limitado  | Min SDK               |

**Min SDK configurado**: Check `android/variables.gradle`

---

## 🚀 Próximos Pasos

1. ✅ Configuración Android completada
2. 🔄 Prueba en dispositivo real
3. ⏳ Ajustar compresión de fotos si es necesario
4. ⏳ Implementar visor de fotos con zoom en admin
5. ⏳ Considerar migración a almacenamiento cloud (S3)

---

## 📚 Referencias

- [Capacitor Camera API](https://capacitorjs.com/docs/apis/camera)
- [Android Camera Permissions](https://developer.android.com/training/permissions/requesting)
- [Android 13 Photo Picker](https://developer.android.com/training/data-storage/shared/photopicker)
- [FileProvider Guide](https://developer.android.com/reference/androidx/core/content/FileProvider)

---

**Estado**: ✅ Configuración Android completada y sincronizada
**Fecha**: 7 de noviembre de 2025
