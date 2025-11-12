# 🔊 FIX: Sonido en Notificaciones Push

## ❌ Problema: Las notificaciones llegan pero NO suenan

### ✅ Solución Completa

---

## 🔧 Paso 1: Desinstalar y Reinstalar la App

**Razón**: Android **NO actualiza** los canales de notificación una vez creados. Necesitas reinstalar.

### En PowerShell:

```powershell
cd c:\laragon\www\delivery-go-fast\delivery-frontend

# 1. Desinstalar app del emulador/dispositivo
adb uninstall com.deliverygofast1.app

# 2. Sincronizar cambios
npx cap sync android

# 3. Ejecutar en Android
npx cap run android
```

---

## 🔧 Paso 2: Verificar Configuración del Dispositivo

### **Opción A: Desde la App (Android 8+)**

1. Cuando llegue una notificación, **mantén presionado** sobre ella
2. Toca el ícono de engranaje ⚙️
3. Verifica que **"Sonido"** esté habilitado
4. Verifica que **"Vibración"** esté habilitada
5. Verifica que la **Importancia** sea "Alta" o "Urgente"

### **Opción B: Desde Configuración del Sistema**

```
Settings > Apps > Delivery Go Fast > Notifications >
Nuevos Pedidos >
  ✅ Sound: ON
  ✅ Vibration: ON
  ✅ Importance: High/Urgent
```

---

## 🔧 Paso 3: Verificar Modo "No Molestar"

```
Settings > Sound > Do Not Disturb
```

Asegúrate de que esté **desactivado** o que la app esté en la lista de excepciones.

---

## 🔧 Paso 4: Verificar Logs de Android

Busca en Logcat si los canales se están creando:

```
Filtro: "Canal.*creado" o "notification"

✅ Deberías ver:
🔔 Creando canales de notificación de alta prioridad...
✅ Canal "pedidos_criticos" creado
✅ Canal "estado_pedidos" creado
✅ Canal "delivery_driver" creado
```

---

## 🔧 Paso 5: Probar con Notificación de Prueba

```bash
POST https://api.gofastdelivery.site/notifications/test
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "title": "🔊 Prueba de Sonido",
  "body": "Esta notificación DEBE sonar"
}
```

**Resultado esperado**:

- ✅ Notificación visible
- ✅ Sonido audible
- ✅ Vibración (si está habilitada)

---

## 📱 Configuración Aplicada

### **AndroidManifest.xml**

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.USE_FULL_SCREEN_INTENT" />
```

### **push-notification.service.ts**

```typescript
const pedidosChannel: Channel = {
  id: "pedidos_criticos",
  name: "Nuevos Pedidos",
  importance: 5, // URGENTE
  sound: "default", // ⬅️ Sonido predeterminado
  vibration: true,
  lights: true,
};
```

### **Backend (notifications.service.ts)**

```typescript
android: {
  priority: 'high',
  notification: {
    sound: 'default',     // ⬅️ Sonido predeterminado
    channelId: 'pedidos_criticos',
    defaultSound: true,   // ⬅️ Usar sonido del sistema
  },
}
```

---

## 🚨 Si AÚN no suena

### **Verificación 1: Probar con sonido personalizado**

Si quieres un sonido más fuerte:

1. Descarga un archivo de sonido (ej: `order_alert.mp3`)
2. Convierte a formato compatible:
   - Android: `.mp3` o `.wav`
3. Colócalo en: `android/app/src/main/res/raw/order_alert.mp3`
4. Actualiza el canal:

```typescript
const pedidosChannel: Channel = {
  id: "pedidos_criticos",
  name: "Nuevos Pedidos",
  importance: 5,
  sound: "order_alert.mp3", // ⬅️ Tu sonido personalizado
  vibration: true,
};
```

### **Verificación 2: Probar en dispositivo físico**

Los emuladores a veces tienen problemas con el audio:

1. Conecta un dispositivo Android físico
2. Habilita "Depuración USB"
3. Ejecuta:
   ```bash
   npx cap run android --target=<tu_dispositivo>
   ```

### **Verificación 3: Logs detallados**

En Logcat, filtra por:

```
Tag: "Notification"
Level: Debug
```

Busca mensajes como:

- `NotificationChannel created`
- `Notification posted`
- `Sound played`

---

## 📋 Checklist de Verificación

- [ ] App desinstalada completamente
- [ ] Permisos `VIBRATE` y `USE_FULL_SCREEN_INTENT` agregados
- [ ] App reinstalada con `npx cap run android`
- [ ] Login completado
- [ ] Permisos de notificaciones aceptados
- [ ] Canales creados (verificado en Logcat)
- [ ] Modo "No molestar" desactivado
- [ ] Volumen del dispositivo > 50%
- [ ] Notificación de prueba enviada
- [ ] ✅ **Sonido audible**

---

## 🎯 Resultado Esperado

Después de seguir estos pasos:

1. **Notificación llega** ✅
2. **Sonido se reproduce** ✅
3. **Dispositivo vibra** ✅
4. **LED parpadea** (si el dispositivo tiene) ✅

---

## 🆘 Última Opción

Si después de todo esto **NO suena**:

1. Verifica el volumen del dispositivo:

   - Volumen de notificaciones (no el de medios)
   - Debe estar > 50%

2. Prueba con otra app de notificaciones:

   - Envía un mensaje de WhatsApp
   - Si WhatsApp tampoco suena, es problema del dispositivo

3. Reinicia el dispositivo:
   ```bash
   adb reboot
   ```

---

## ✅ Confirmación

Una vez que funcione, deberías ver/escuchar:

```
📱 Notificación visible en la barra
🔊 Sonido: "ding" (o el personalizado)
📳 Vibración: 2-3 vibraciones cortas
💡 LED: Rojo parpadeante (nuevos pedidos)
```

---

## 📞 ¿Necesitas más ayuda?

Comparte:

1. Logs de Logcat (filtrar por "notification")
2. Captura de pantalla de la configuración del canal
3. Versión de Android del dispositivo
4. Si es emulador o dispositivo físico

Con esa info puedo ayudarte a identificar el problema exacto.
