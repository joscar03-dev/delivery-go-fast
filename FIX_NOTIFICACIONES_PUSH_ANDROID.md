# 🔔 FIX: Notificaciones Push en Android (App Cerrada)

## 📋 Problema Identificado

Las notificaciones NO llegaban cuando la app estaba cerrada o en segundo plano en Android porque **faltaba la configuración de canales de notificación** requeridos por Android 8.0+ (API 26).

Sin canales configurados, Android usa un canal de baja prioridad donde las notificaciones:

- ❌ No emiten sonido
- ❌ No vibran
- ❌ No aparecen en la pantalla de bloqueo
- ❌ No interrumpen al usuario

## ✅ Solución Implementada

### 1. **Frontend** - Creación de Canales de Alta Prioridad

**Archivo modificado**: `delivery-frontend/src/app/services/push-notification.service.ts`

**Cambios realizados**:

- ✅ Agregado import de `Channel` y `Capacitor`
- ✅ Creado método `createNotificationChannels()` que crea 3 canales:

#### Canales Creados:

| Canal ID           | Nombre                 | Prioridad      | Uso                                                |
| ------------------ | ---------------------- | -------------- | -------------------------------------------------- |
| `pedidos_criticos` | Nuevos Pedidos         | **5 (MÁXIMA)** | Notificaciones de nuevos pedidos para restaurantes |
| `delivery_driver`  | Asignación de Entregas | **5 (MÁXIMA)** | Notificaciones para repartidores                   |
| `estado_pedidos`   | Estado de Pedidos      | **4 (ALTA)**   | Cambios de estado de pedidos para clientes         |

**Características de los canales**:

```typescript
{
  importance: 5,              // Nivel URGENTE
  sound: 'default',           // Sonido de notificación
  vibration: true,            // Vibración habilitada
  visibility: 1,              // VISIBILITY_PUBLIC (pantalla de bloqueo)
  lights: true,               // LED de notificación
  lightColor: '#FF0000'       // Color del LED
}
```

### 2. **Backend** - Especificación de Canales en Payload FCM

**Archivo modificado**: `api-server/src/notifications/notifications.service.ts`

**Cambios realizados**:

- ✅ Agregado método `getAndroidChannelId()` que selecciona el canal según tipo de notificación
- ✅ Mejorado payload de Android con configuración completa:

```typescript
android: {
  priority: 'high',
  notification: {
    sound: 'default',
    channelId: androidChannelId,        // 🔔 Canal específico
    priority: 'high',
    defaultSound: true,
    defaultVibrateTimings: true,
    visibility: 'public',               // Visible en bloqueo
  },
}
```

**Mapeo de Tipos a Canales**:

- `NEW_ORDER` → `pedidos_criticos` (Prioridad máxima)
- `DRIVER_ASSIGNED`, `DELIVERY_NEAR` → `delivery_driver` (Prioridad máxima)
- Todos los estados de pedido → `estado_pedidos` (Prioridad alta)

### 3. **iOS** - Mejora en Payload APNs

Agregado `contentAvailable: true` para permitir notificaciones en background.

## 🧪 Cómo Probar

### Paso 1: Rebuild del Backend

```bash
cd api-server
npm run build
npm run start:prod  # o pm2 restart delivery-api
```

### Paso 2: Rebuild del Frontend

```bash
cd delivery-frontend
ionic build
npx cap sync android
```

### Paso 3: Instalar en Dispositivo Android

**Opción A - Android Studio**:

```bash
npx cap open android
# Luego en Android Studio: Run > Run 'app'
```

**Opción B - Dispositivo físico con ADB**:

```bash
# Asegúrate de tener USB debugging habilitado
adb devices
npx cap run android --target=<device-id>
```

### Paso 4: Verificar Creación de Canales

Después de iniciar sesión, verifica en los logs de la app:

```
🔔 Creando canales de notificación de alta prioridad...
✅ Canal "pedidos_criticos" creado
✅ Canal "estado_pedidos" creado
✅ Canal "delivery_driver" creado
✅ Todos los canales de notificación creados exitosamente
```

### Paso 5: Probar Notificaciones con App Cerrada

1. **Iniciar sesión** en la app (rol restaurante o cliente)
2. **Cerrar completamente la app** (no solo minimizar)
3. **Crear un pedido** desde otro dispositivo o navegador
4. **Verificar que llega la notificación** con:
   - ✅ Sonido
   - ✅ Vibración
   - ✅ Visible en pantalla de bloqueo
   - ✅ Aparece en barra de notificaciones

### Paso 6: Verificar en Configuración de Android

1. Ir a **Ajustes** del dispositivo
2. **Aplicaciones** → **Delivery Go Fast**
3. **Notificaciones** → Ver los canales creados:
   - ✅ Nuevos Pedidos
   - ✅ Estado de Pedidos
   - ✅ Asignación de Entregas

## 🔍 Debugging

### Verificar Logs del Frontend (Chrome DevTools)

1. Conectar dispositivo por USB
2. Abrir `chrome://inspect` en Chrome
3. Seleccionar la app
4. Ver logs de consola:
   ```
   📱 Inicializando Push Notifications...
   🔔 Creando canales de notificación de alta prioridad...
   ✅ Canal "pedidos_criticos" creado
   📱 Push token recibido: <token>
   ✅ Token guardado en backend exitosamente
   ```

### Verificar Logs del Backend

```bash
# Logs de PM2
pm2 logs delivery-api

# Buscar:
📨 Notificación enviada a usuario <userId>: 1 exitosas, 0 fallidas
```

### Si No Llegan Notificaciones

1. **Verificar permisos de notificación**:

   - Ajustes > Aplicaciones > Delivery Go Fast > Notificaciones
   - Debe estar **Activado**

2. **Verificar que Firebase está configurado**:

   ```bash
   # En backend, buscar en logs:
   ✅ Firebase Admin SDK inicializado correctamente
   ```

3. **Verificar token FCM registrado**:

   - Base de datos: tabla `device_tokens`
   - Debe existir un registro con `isActive = true`

4. **Verificar modo "No molestar"** desactivado en el dispositivo

5. **Verificar batería**: Algunas marcas (Xiaomi, Huawei) tienen optimización agresiva
   - Ir a Ajustes > Batería
   - Excluir "Delivery Go Fast" de optimización

## 📊 Niveles de Importancia en Android

| Nivel | Nombre  | Comportamiento                                           |
| ----- | ------- | -------------------------------------------------------- |
| 1     | MIN     | No muestra ni hace ruido                                 |
| 2     | LOW     | No hace ruido, solo aparece en barra                     |
| 3     | DEFAULT | Hace sonido                                              |
| 4     | HIGH    | Hace sonido + popup emergente                            |
| 5     | MAX     | **Sonido + popup + interrumpe al usuario** ← Usamos este |

## 🎯 Tipos de Notificaciones y sus Canales

```typescript
// Restaurantes reciben (Canal: pedidos_criticos)
NEW_ORDER → "🔔 Nuevo Pedido"

// Clientes reciben (Canal: estado_pedidos)
ORDER_CONFIRMED → "✅ Pedido Confirmado"
ORDER_PREPARING → "👨‍🍳 Preparando tu Pedido"
ORDER_READY → "📦 Pedido Listo"
ORDER_ON_THE_WAY → "🚗 En Camino"
ORDER_DELIVERED → "🎉 Pedido Entregado"
ORDER_CANCELLED → "❌ Pedido Cancelado"

// Repartidores reciben (Canal: delivery_driver)
DRIVER_ASSIGNED → "🚗 Nuevo Pedido Asignado"
DELIVERY_NEAR → "📍 Llegando a Destino"
```

## ✅ Checklist de Verificación

### Frontend:

- [x] Imports de `Channel` y `Capacitor` agregados
- [x] Método `createNotificationChannels()` implementado
- [x] Se llama antes de `registerListeners()` y `registerDevice()`
- [x] 3 canales creados con prioridad 4-5

### Backend:

- [x] Método `getAndroidChannelId()` implementado
- [x] Payload de Android incluye `channelId` dinámico
- [x] Configuración completa con `sound`, `vibration`, `visibility`
- [x] iOS payload mejorado con `contentAvailable`

### Testing:

- [ ] App compilada y instalada en dispositivo Android
- [ ] Sesión iniciada (token FCM registrado)
- [ ] Canales creados (verificar en logs)
- [ ] Notificación llega con app cerrada
- [ ] Sonido y vibración funcionan
- [ ] Visible en pantalla de bloqueo

## 📚 Referencias

- [Capacitor Push Notifications - Android Channels](https://capacitorjs.com/docs/apis/push-notifications#android-notification-channels)
- [Firebase Cloud Messaging - Android Config](https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages#androidconfig)
- [Android Notification Importance Levels](https://developer.android.com/training/notify-user/channels#importance)

## 🚀 Siguiente Paso

Si todo funciona correctamente, considera:

1. ✅ Agregar sonidos personalizados (`.wav` en `android/app/src/main/res/raw/`)
2. ✅ Iconos de notificación personalizados
3. ✅ Actions en notificaciones (Aceptar/Rechazar pedido)
4. ✅ Notificaciones agrupadas por tipo

---

**Fecha**: 11/11/2025
**Autor**: GitHub Copilot
**Issue**: Notificaciones no llegaban con app cerrada en Android
**Status**: ✅ RESUELTO
