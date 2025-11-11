# 📱 Guía de Pruebas - Notificaciones Push en Android Studio

## ✅ Sistema Implementado

El sistema de notificaciones ahora funciona **AUTOMÁTICAMENTE** con arquitectura event-driven:

- ✅ Eventos emitidos desde `OrdersService`
- ✅ Listeners automáticos en `NotificationsService`
- ✅ Retry logic con 3 intentos (1s, 2s, 4s)
- ✅ Cron job de limpieza diaria

## 🎯 Escenarios de Prueba

### Escenario 1: Cliente Crea Pedido → Restaurante Recibe Notificación

**Actores**:

- 📱 **Dispositivo 1**: App móvil como CLIENTE
- 📱 **Dispositivo 2**: App móvil como DUEÑO DE RESTAURANTE

**Flujo**:

1. **Dispositivo 2 (Restaurante)**: Login con cuenta de restaurante
2. **Dispositivo 2**: Registrar token push (automático al iniciar app)
3. **Dispositivo 1 (Cliente)**: Login con cuenta de cliente
4. **Dispositivo 1**: Crear pedido en el restaurante
5. **✅ RESULTADO ESPERADO**: **Dispositivo 2 recibe notificación push** con:
   - Título: "🔔 Nuevo Pedido #{orderNumber}"
   - Cuerpo: "Cliente {nombre} - Total: ${monto}"

### Escenario 2: Restaurante Cambia Estado → Cliente Recibe Notificación

**Actores**:

- 📱 **Dispositivo 1**: App móvil como CLIENTE
- 📱 **Dispositivo 2**: App móvil como RESTAURANTE

**Flujo**:

1. **Dispositivo 1 (Cliente)**: Login y crear pedido (estado: PENDING)
2. **Dispositivo 2 (Restaurante)**: Confirmar pedido (cambio a CONFIRMED)
3. **✅ RESULTADO ESPERADO**: **Dispositivo 1 recibe notificación push** con:
   - Título: "📦 Pedido #{orderNumber}"
   - Cuerpo: "Tu pedido está {estado}"

## 🔧 Configuración Previa (Una sola vez)

### 1. Verificar Firebase en Android

**Archivo**: `delivery-frontend/android/app/google-services.json`

Debe existir este archivo con la configuración de tu proyecto Firebase.

### 2. Verificar Permisos en AndroidManifest.xml

**Archivo**: `delivery-frontend/android/app/src/main/AndroidManifest.xml`

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
```

### 3. Verificar Backend Configurado

**Backend debe estar corriendo**:

```bash
cd c:\laragon\www\delivery-go-fast\api-server
npm run start:dev
```

Verificar logs:

```
[Nest] LOG [InstanceLoader] EventEmitterModule dependencies initialized ✅
[Nest] LOG [InstanceLoader] ScheduleModule dependencies initialized ✅
[Nest] LOG [NotificationsService] ✅ Firebase Admin SDK inicializado ✅
```

## 🚀 Ejecutar Pruebas en Android Studio

### Paso 1: Iniciar Backend

```powershell
cd c:\laragon\www\delivery-go-fast\api-server
npm run start:dev
```

Mantener esta terminal abierta para ver logs en tiempo real.

### Paso 2: Abrir Android Studio

```powershell
cd c:\laragon\www\delivery-go-fast\delivery-frontend
ionic capacitor sync android
ionic capacitor open android
```

### Paso 3: Configurar 2 Dispositivos/Emuladores

**Opción A: 2 Emuladores**

- Android Studio → AVD Manager → Crear 2 emuladores
- Emulador 1: Pixel 5 (Cliente)
- Emulador 2: Pixel 6 (Restaurante)

**Opción B: 1 Emulador + 1 Dispositivo Real**

- Conectar teléfono físico con cable USB
- Habilitar "Depuración USB" en el teléfono
- Usar emulador para el otro rol

### Paso 4: Ejecutar App en Ambos Dispositivos

**En Android Studio**:

1. Click en el dropdown de dispositivos (arriba)
2. Seleccionar "Emulador 1"
3. Click en ▶️ Run
4. Esperar que instale y abra la app
5. Cambiar dropdown a "Emulador 2"
6. Click en ▶️ Run nuevamente

Ahora tienes 2 instancias de la app corriendo.

### Paso 5: Configurar Cuentas

**Dispositivo 1 (Cliente)**:

1. Registrar cuenta nueva o login como cliente
2. Verificar que se registre el token push (ver logs del backend)

**Dispositivo 2 (Restaurante)**:

1. Login con cuenta de dueño de restaurante
2. Verificar que se registre el token push (ver logs del backend)

**Logs esperados en backend**:

```
[NotificationsService] 📱 Token registrado para usuario {userId}: {token}
[NotificationsService] ✅ Token guardado correctamente
```

### Paso 6: Crear Pedido y Verificar Notificación

**En Dispositivo 1 (Cliente)**:

1. Ir a lista de restaurantes
2. Seleccionar el restaurante del Dispositivo 2
3. Agregar items al carrito
4. Ir a checkout
5. **Click en "Confirmar Pedido"**

**✅ VERIFICAR**:

**En Backend (logs)**:

```
[OrdersService] ✅ [Event] Evento 'order.created' emitido para pedido {orderId}
[NotificationsService] 📨 [Event Listener] Procesando evento order.created para pedido {orderId}
[NotificationsService] 📨 Notificación enviada a usuario {restaurantOwnerId}: 1 exitosas, 0 fallidas
[NotificationsService] ✅ [Event Listener] Notificación de nuevo pedido enviada al restaurante
```

**En Dispositivo 2 (Restaurante)**:

- 🔔 **Aparece notificación push** en la barra de notificaciones
- Título: "🔔 Nuevo Pedido #1234"
- Cuerpo: "Cliente Juan Pérez - Total: $25.50"
- Al hacer tap: abre la app en la pantalla de pedidos

### Paso 7: Cambiar Estado y Verificar Notificación

**En Dispositivo 2 (Restaurante)**:

1. Abrir la app (si no está abierta)
2. Ir a "Mis Pedidos" o "Panel de Restaurante"
3. Ver el pedido recién creado
4. **Click en "Aceptar Pedido"** (cambia estado a CONFIRMED)

**✅ VERIFICAR**:

**En Backend (logs)**:

```
[OrdersService] ✅ [Event] Evento 'order.status.changed' emitido para pedido {orderId}: pending → confirmed
[NotificationsService] 📨 [Event Listener] Procesando evento order.status.changed
[NotificationsService] 📨 Notificación enviada a usuario {clientId}: 1 exitosas, 0 fallidas
[NotificationsService] ✅ [Event Listener] Notificación de cambio de estado enviada al usuario
```

**En Dispositivo 1 (Cliente)**:

- 🔔 **Aparece notificación push** en la barra de notificaciones
- Título: "📦 Pedido #1234"
- Cuerpo: "Tu pedido en {Restaurante} está confirmado"
- Al hacer tap: abre la app en la pantalla del pedido

## 🐛 Troubleshooting

### ❌ No aparece notificación en el dispositivo

**1. Verificar registro de token**

Ver logs del backend al abrir la app:

```
[NotificationsService] 📱 Token registrado para usuario {userId}: {token}
```

Si no aparece, verificar que el frontend esté enviando el token.

**2. Verificar permisos de notificaciones**

En el dispositivo Android:

- Configuración → Apps → Delivery App → Notificaciones → Permitir

**3. Verificar Firebase configurado**

```bash
# Backend debe tener este archivo:
c:\laragon\www\delivery-go-fast\api-server\firebase-service-account.json

# Frontend debe tener este archivo:
c:\laragon\www\delivery-go-fast\delivery-frontend\android\app\google-services.json
```

**4. Verificar que el backend envió la notificación**

En logs del backend buscar:

```
📨 Notificación enviada a usuario {userId}: 1 exitosas, 0 fallidas
```

Si dice "0 exitosas, 1 fallidas", ver el error en logs.

**5. Verificar que el usuario tiene tokens activos**

Consultar en base de datos:

```sql
SELECT * FROM device_tokens WHERE userId = {userId} AND isActive = true;
```

### ❌ Error "Firebase not initialized"

**Solución**: Verificar que existe `firebase-service-account.json` en `api-server/`

```powershell
Test-Path c:\laragon\www\delivery-go-fast\api-server\firebase-service-account.json
```

Si retorna `False`, descargar el archivo desde Firebase Console:

1. Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Guardar como `firebase-service-account.json` en `api-server/`

### ❌ Error "No tokens registered for user"

**Solución**: El usuario no ha abierto la app o no se registró el token.

1. Abrir la app en el dispositivo
2. Login con el usuario
3. Verificar logs del backend: debe mostrar "Token registrado"

### ❌ Notificación llega pero no hace nada al hacer tap

**Solución**: Verificar que el frontend tenga configurado el handler de notificaciones.

Ver archivo: `delivery-frontend/src/app/services/push-notifications.service.ts`

Debe tener un listener:

```typescript
PushNotifications.addListener(
  "pushNotificationActionPerformed",
  (notification) => {
    // Navegar a la pantalla correspondiente
  }
);
```

## 📊 Monitorear en Tiempo Real

### Ver logs del backend en tiempo real

```powershell
cd c:\laragon\www\delivery-go-fast\api-server
npm run start:dev
```

### Ver logs de Android en Android Studio

**Logcat** (abajo en Android Studio):

- Filtrar por tag: "PushNotifications"
- Ver mensajes de Firebase: "FCM"

### Ver notificaciones en Firebase Console

1. Firebase Console → Cloud Messaging
2. Ver estadísticas de notificaciones enviadas

## ✅ Checklist de Prueba Completa

- [ ] Backend iniciado y sin errores
- [ ] Emulador/Dispositivo 1 con app instalada (Cliente)
- [ ] Emulador/Dispositivo 2 con app instalada (Restaurante)
- [ ] Login en ambos dispositivos
- [ ] Tokens registrados en backend (ver logs)
- [ ] Cliente crea pedido
- [ ] **Restaurante recibe notificación push** ✅
- [ ] Restaurante acepta pedido
- [ ] **Cliente recibe notificación push** ✅
- [ ] Logs del backend muestran eventos emitidos ✅
- [ ] Logs del backend muestran listeners ejecutados ✅

## 🎯 Resultado Esperado

Si todo funciona correctamente:

1. **Crear pedido** → Notificación al restaurante en **menos de 1 segundo**
2. **Cambiar estado** → Notificación al cliente en **menos de 1 segundo**
3. **Logs estructurados** con emojis en cada paso
4. **Reintentos automáticos** si hay fallo (3 intentos)
5. **Sin intervención manual** - todo es automático

## 📝 Notas Importantes

- **No necesitas tocar código** - el sistema ya está implementado
- **Los eventos se emiten automáticamente** cuando se crean/actualizan pedidos
- **Los listeners se ejecutan automáticamente** al recibir eventos
- **Firebase maneja la entrega** de notificaciones push
- **El retry logic maneja fallos** automáticamente

---

**Sistema implementado**: Event-Driven Architecture  
**Estado**: ✅ LISTO PARA PROBAR  
**Fecha**: 11/11/2025
