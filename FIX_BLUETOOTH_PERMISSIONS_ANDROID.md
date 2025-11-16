# 🔧 Fix: Permisos de Bluetooth para Android 12+

## ❌ Problema Original

```
Error: Need android.permission.BLUETOOTH_CONNECT permission
AdapterService getBondedDevices
```

**Causa:** Desde Android 12 (API 31+), Google cambió el sistema de permisos de Bluetooth. Ahora se requieren permisos específicos en tiempo de ejecución.

---

## ✅ Solución Implementada

### **1. Permisos agregados en AndroidManifest.xml**

```xml
<!-- Bluetooth Permissions for Thermal Printer -->
<!-- Para Android 12+ (API 31+) -->
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN"
    android:usesPermissionFlags="neverForLocation" />

<!-- Para Android 11 y anteriores (API 30 y menor) -->
<uses-permission android:name="android.permission.BLUETOOTH"
    android:maxSdkVersion="30" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN"
    android:maxSdkVersion="30" />
```

### **2. Plugin de permisos instalado**

```bash
npm install cordova-plugin-android-permissions
npx cap sync android
```

### **3. Método de solicitud de permisos agregado**

En `thermal-printer.service.ts`:

```typescript
async requestBluetoothPermissions(): Promise<boolean> {
  if (!this.platform.is('android')) {
    return true; // iOS no necesita estos permisos
  }

  // Para Android 12+ (API 31+)
  if (typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.permissions) {
    const permissions = cordova.plugins.permissions;

    const permissionsToRequest = [
      permissions.BLUETOOTH_CONNECT,
      permissions.BLUETOOTH_SCAN,
    ];

    // Verificar y solicitar permisos...
  }
}
```

### **4. Flujo actualizado en searchPrinters()**

```typescript
async searchPrinters(): Promise<PrinterDevice[]> {
  // 1. Solicitar permisos de Bluetooth (Android 12+) ← NUEVO
  const permissionsGranted = await this.requestBluetoothPermissions();
  if (!permissionsGranted) {
    // Mostrar alerta explicativa
    throw new Error('Permisos de Bluetooth denegados');
  }

  // 2. Verificar si Bluetooth está habilitado
  const enabled = await this.isBluetoothEnabled();

  // 3. Buscar dispositivos emparejados
  const devices = await this.listPairedDevices();

  return devices;
}
```

---

## 🧪 Cómo Probar

### **Paso 1: Recompilar y Desplegar**

```bash
npm run build
npx cap sync android
npx cap open android
```

### **Paso 2: Probar en dispositivo**

1. Instalar APK en dispositivo Android 12+
2. Abrir app → Gestión de Pedidos
3. Tocar ícono de Bluetooth
4. **La app solicitará permisos de Bluetooth** ← Ahora aparece este diálogo
5. Aceptar permisos
6. ✅ Verás la lista de impresoras emparejadas

---

## 📱 Experiencia del Usuario

### **Primera vez:**

```
1. Usuario toca botón Bluetooth
   ↓
2. Android muestra: "¿Permitir a Delivery Go Fast
   conectarse a dispositivos Bluetooth cercanos?"
   ↓
3. Usuario toca "Permitir"
   ↓
4. ✅ Se muestran impresoras disponibles
```

### **Siguientes veces:**

```
1. Usuario toca botón Bluetooth
   ↓
2. ✅ Directamente muestra impresoras (permisos ya otorgados)
```

### **Si usuario deniega permisos:**

```
1. Usuario toca "Denegar"
   ↓
2. App muestra: "⚠️ Permisos requeridos
   La app necesita permisos de Bluetooth para conectarse
   a la impresora. Por favor, ve a Configuración y
   otorga los permisos."
   ↓
3. Usuario debe ir manualmente a:
   Configuración → Apps → Delivery Go Fast → Permisos
```

---

## 🔍 Diferencias por Versión de Android

| Versión Android              | Permisos Necesarios                   | Solicitud             |
| ---------------------------- | ------------------------------------- | --------------------- |
| Android 11 o menor (API ≤30) | `BLUETOOTH`, `BLUETOOTH_ADMIN`        | Automático (manifest) |
| **Android 12+ (API ≥31)**    | `BLUETOOTH_CONNECT`, `BLUETOOTH_SCAN` | **Runtime (manual)**  |

---

## 📋 Archivos Modificados

1. ✅ **android/app/src/main/AndroidManifest.xml**

   - Agregados permisos de Bluetooth (4 líneas)

2. ✅ **src/app/services/thermal-printer.service.ts**

   - Método `requestBluetoothPermissions()` (nuevo)
   - Método `searchPrinters()` actualizado (agregado paso 1)
   - Import de `Capacitor` y `cordova`

3. ✅ **package.json**
   - Plugin `cordova-plugin-android-permissions@1.1.5`

---

## ✅ Checklist de Verificación

- [x] Permisos agregados en AndroidManifest.xml
- [x] Plugin de permisos instalado
- [x] Método requestBluetoothPermissions() implementado
- [x] searchPrinters() actualizado
- [x] Compilación exitosa
- [x] Sincronización con Android completada
- [ ] **Probado en dispositivo real Android 12+** ← SIGUIENTE PASO

---

## 🚀 Próximo Paso: Probar en Dispositivo

Ahora que todo está configurado, prueba en tu dispositivo Android:

```bash
# En Android Studio:
Run > Run 'app'

# O desde terminal:
ionic cap run android
```

**Resultado esperado:**

- Al tocar botón Bluetooth, Android solicitará permisos
- Después de aceptar, verás lista de impresoras
- ✅ Sin más errores de BLUETOOTH_CONNECT

---

## 📝 Notas Adicionales

- **iOS no necesita estos cambios** (no usa este plugin)
- **Web tampoco** (no tiene acceso a Bluetooth nativo)
- Solo afecta a **Android 12 y superiores**
- Dispositivos con Android 11 o menor funcionan sin cambios

---

**Estado:** ✅ IMPLEMENTADO  
**Probado:** ⏳ Pendiente prueba en dispositivo  
**Fecha:** 15 de noviembre de 2025  
**Blocker resuelto:** Error de permisos BLUETOOTH_CONNECT
