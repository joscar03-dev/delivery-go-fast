# 🔔📡 Sistema Híbrido de Notificaciones - Delivery Go Fast

## 📊 Arquitectura del Sistema

Este proyecto implementa un **sistema híbrido inteligente** que combina:

1. **Socket.IO** - Para actualizaciones en tiempo real cuando la app está abierta
2. **Push Notifications (FCM)** - Para notificar cuando la app está cerrada

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (App Móvil)                      │
│                                                             │
│  ┌──────────────┐              ┌──────────────┐           │
│  │  Socket.IO   │              │    FCM       │           │
│  │   Client     │              │   Client     │           │
│  │              │              │              │           │
│  │  • Conexión  │              │  • Token     │           │
│  │    WebSocket │              │    Registro  │           │
│  │  • Tiempo    │              │  • Background│           │
│  │    real      │              │    Delivery  │           │
│  └──────┬───────┘              └──────┬───────┘           │
│         │                             │                    │
└─────────┼─────────────────────────────┼────────────────────┘
          │                             │
          │                             │
┌─────────┼─────────────────────────────┼────────────────────┐
│         │    BACKEND (NestJS)         │                    │
│         │                             │                    │
│  ┌──────▼───────┐       ┌─────────────▼──────┐           │
│  │ DeliveryGw   │       │ NotificationsService│           │
│  │ (Socket.IO)  │       │  (Firebase Admin)   │           │
│  └──────┬───────┘       └─────────┬────────────┘           │
│         │                         │                        │
│         │    ┌────────────────────┘                        │
│         │    │                                             │
│  ┌──────▼────▼──────┐                                     │
│  │  OrdersService   │   ← Evento de pedido                │
│  │                  │                                      │
│  │  • create()      │   ✅ emit Socket.IO                 │
│  │  • updateStatus()│   ✅ send Push Notification         │
│  └──────────────────┘                                     │
└─────────────────────────────────────────────────────────────┘
          │                             │
          │                             │
┌─────────▼─────────────────────────────▼────────────────────┐
│                    Firebase Cloud                          │
│                                                             │
│  • Entrega notificaciones a dispositivos                   │
│  • APNs para iOS                                           │
│  • FCM para Android                                        │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Flujo de Eventos

### Escenario 1: Usuario con app ABIERTA

```
1. Cliente crea pedido
   ↓
2. Backend: OrdersService.create()
   ↓
3. Backend emite AMBOS:
   ├→ Socket.IO event "new-order-available"  ✅ USADO
   └→ Push Notification                       ⏭️ IGNORADO
   ↓
4. Frontend (Restaurant):
   ├→ SocketService detecta evento
   ├→ Actualiza UI inmediatamente
   ├→ Muestra toast notification
   └→ Push notification no se muestra (app abierta)
```

**Ventaja**: Actualización instantánea sin delay

### Escenario 2: Usuario con app CERRADA/BACKGROUND

```
1. Cliente crea pedido
   ↓
2. Backend: OrdersService.create()
   ↓
3. Backend emite AMBOS:
   ├→ Socket.IO event "new-order-available"  ⏭️ NO CONECTADO
   └→ Push Notification via FCM              ✅ ENTREGADO
   ↓
4. FCM entrega a dispositivo
   ↓
5. Sistema operativo muestra notificación
   ↓
6. Usuario toca notificación
   ↓
7. App abre en pantalla correcta
```

**Ventaja**: Usuario recibe notificación incluso con app cerrada

## 📋 Eventos Implementados

### 🆕 Nuevo Pedido

**Trigger**: `OrdersService.create()`

**Socket.IO**:

```typescript
event: "new-order-available";
data: {
  orderId,
    orderNumber,
    restaurantName,
    totalAmount,
    deliveryAddress,
    restaurantId,
    status;
}
```

**Push Notification** (al dueño del restaurante):

```typescript
title: '🔔 Nuevo Pedido'
body: 'Pedido #12345 - $45.50 de Juan Pérez'
data: { orderId, orderNumber, screen: 'restaurant-orders' }
```

### 📦 Cambio de Estado

**Trigger**: `OrdersService.updateStatus()`

**Socket.IO**:

```typescript
event: "order-status-updated";
data: {
  orderId, status, previousStatus;
}
```

**Push Notification** (al cliente):

```typescript
// Estado: confirmed
title: "✅ Pedido Confirmado";
body: "Tu pedido de Pizza Italia ha sido confirmado";

// Estado: preparing
title: "👨‍🍳 Preparando tu Pedido";
body: "Pizza Italia está preparando tu pedido";

// Estado: out_for_delivery
title: "🚗 En Camino";
body: "Tu pedido está en camino. ¡Llegará pronto!";

// Estado: delivered
title: "🎉 Pedido Entregado";
body: "Tu pedido ha sido entregado. ¡Buen provecho!";
```

## 🗂️ Estructura del Código

### Backend

```
api-server/src/
├── notifications/
│   ├── notifications.module.ts          # Módulo de notificaciones
│   ├── notifications.service.ts         # Lógica de FCM
│   ├── notifications.controller.ts      # Endpoints REST
│   ├── entities/
│   │   └── device-token.entity.ts       # Almacena tokens FCM
│   └── dto/
│       └── register-device-token.dto.ts
│
├── orders/
│   ├── orders.service.ts
│   │   ├── emitNewOrderEvent()          # Socket.IO + Push
│   │   └── emitOrderStatusUpdate()      # Socket.IO + Push
│   └── orders.module.ts                 # Importa NotificationsModule
│
└── firebase-service-account.json        # Credenciales (NO SUBIR)
```

### Frontend

```
delivery-frontend/src/app/
├── services/
│   ├── socket.service.ts                # Maneja Socket.IO
│   ├── push-notification.service.ts     # Maneja FCM
│   └── auth.service.ts                  # Inicializa push en login
│
├── pages/
│   ├── restaurant-orders/              # Escucha new-order
│   ├── order-detail/                   # Escucha status-update
│   └── order-history/                  # Escucha status-update
│
├── android/app/
│   └── google-services.json            # Config Android (NO SUBIR)
│
└── ios/App/
    └── GoogleService-Info.plist        # Config iOS (NO SUBIR)
```

## 🔐 Seguridad y Tokens

### Almacenamiento de Tokens FCM

**Base de datos** (tabla `device_tokens`):

```sql
CREATE TABLE device_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  token VARCHAR(500) NOT NULL,
  platform ENUM('ios', 'android', 'web'),
  device_info JSONB,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, token)
);
```

### Ciclo de Vida del Token

```
1. Login
   ↓
2. App solicita permisos de notificaciones
   ↓
3. Sistema operativo genera token FCM
   ↓
4. Frontend envía token a backend
   POST /notifications/register-token
   ↓
5. Backend guarda en DB
   ↓
6. Token listo para recibir notificaciones
   ↓
7. Logout
   ↓
8. Frontend elimina token del backend
   DELETE /notifications/unregister-token
   ↓
9. Token inactivo (pero sigue en DB para historial)
```

## 📡 API Endpoints

### Registrar Token

```http
POST /notifications/register-token
Authorization: Bearer <token>
Content-Type: application/json

{
  "token": "fcm_token_here",
  "platform": "android",
  "deviceInfo": {
    "model": "Pixel 6",
    "manufacturer": "Google",
    "osVersion": "13"
  }
}
```

### Desregistrar Token

```http
DELETE /notifications/unregister-token
Authorization: Bearer <token>
Content-Type: application/json

{
  "token": "fcm_token_here"
}
```

## 🧪 Testing

### Probar Socket.IO

```bash
# Terminal 1: Backend
cd api-server
npm run start:dev

# Terminal 2: Test client
node test-websocket.js
```

### Probar Push Notifications

```bash
# Crear endpoint temporal en notifications.controller.ts
@Post('test')
async test(@Req() req: any) {
  return await this.notificationsService.sendToUser(
    req.user.userId,
    {
      title: '🧪 Test',
      body: 'Funciona!',
    }
  );
}

# Llamar endpoint
curl -X POST http://localhost:3000/notifications/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📊 Monitoreo

### Logs Backend

```bash
# Éxito
✅ Firebase Admin SDK inicializado correctamente
✅ Token de dispositivo registrado para usuario abc123 (android)
✅ [Socket.IO] Evento 'new-order-available' emitido
✅ [Push Notification] Enviada al restaurante
📨 Notificación enviada: 1 exitosas, 0 fallidas

# Errores
❌ Error al inicializar Firebase Admin SDK
⚠️ FIREBASE_SERVICE_ACCOUNT_PATH no configurado
⚠️ No hay tokens registrados para usuario abc123
```

### Logs Frontend

```bash
# Éxito
📱 Inicializando Push Notifications...
✅ Listeners de push notifications registrados
✅ Dispositivo registrado para push notifications
📱 Push token recibido: eXaMpLeToKeN...
✅ Token enviado al backend
🔔 Notificación tocada: { orderId: '123' }
🧭 Navegando a order-detail 123

# Info
📬 Notificación recibida (app abierta): {...}
💡 La actualización en tiempo real la maneja Socket.IO
```

## 🎯 Ventajas del Sistema Híbrido

| Aspecto           | Solo Socket.IO   | Solo Push     | Híbrido        |
| ----------------- | ---------------- | ------------- | -------------- |
| **App abierta**   | ✅ Instantáneo   | ❌ Delay 1-2s | ✅ Instantáneo |
| **App cerrada**   | ❌ No funciona   | ✅ Funciona   | ✅ Funciona    |
| **Batería**       | 🔋 Media         | 🔋 Baja       | 🔋 Óptimo      |
| **UX**            | ⭐⭐⭐           | ⭐⭐          | ⭐⭐⭐⭐⭐     |
| **Confiabilidad** | 📶 Requiere WiFi | ✅ Alta       | ✅ Máxima      |

## 🚀 Mejoras Futuras

- [ ] Notificaciones agrupadas (Android)
- [ ] Canales personalizados por tipo
- [ ] Sonidos diferentes por evento
- [ ] Vibración personalizada
- [ ] Rich notifications (imágenes, acciones)
- [ ] Analytics de apertura de notificaciones
- [ ] A/B testing de mensajes
- [ ] Notificaciones programadas
- [ ] Geofencing para "cerca de ti"

## 📚 Referencias

- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [NestJS WebSockets](https://docs.nestjs.com/websockets/gateways)

---

**Sistema implementado por**: GitHub Copilot  
**Fecha**: Noviembre 2025  
**Versión**: 1.0.0
