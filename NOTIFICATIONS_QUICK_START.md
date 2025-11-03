# 🚀 Quick Start - Sistema Híbrido de Notificaciones

## ✅ ¿Qué se ha implementado?

- ✅ **NotificationsModule** (Backend) - Servicio completo de push notifications con Firebase
- ✅ **PushNotificationService** (Frontend) - Cliente de notificaciones push
- ✅ **Sistema Híbrido** - Socket.IO + Push Notifications funcionando juntos
- ✅ **Integración automática** - Se inicializa al hacer login
- ✅ **Endpoints REST** - Para registrar/desregistrar dispositivos
- ✅ **Base de datos** - Tabla `device_tokens` para almacenar tokens FCM
- ✅ **Documentación completa** - Guías detalladas de configuración

## 🏃 Inicio Rápido

### 1. Configurar Firebase (Backend)

```bash
# 1. Ir a https://console.firebase.google.com
# 2. Crear proyecto "delivery-go-fast"
# 3. Ir a Project Settings > Service Accounts
# 4. Generar nueva clave privada (JSON)
# 5. Guardar como: api-server/firebase-service-account.json
```

Agregar al `.env`:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

### 2. Compilar Backend

```bash
cd api-server
npm run build
npm run start:dev
```

Deberías ver:

```
✅ Firebase Admin SDK inicializado correctamente
```

### 3. Configurar Firebase (Frontend - Android)

```bash
# 1. En Firebase Console, agregar app Android
# 2. Package name: com.deliverygofast.app
# 3. Descargar google-services.json
# 4. Colocar en: delivery-frontend/android/app/google-services.json
```

### 4. Sincronizar Capacitor

```bash
cd delivery-frontend
npx cap sync
```

### 5. Probar en Dispositivo

```bash
# Android
npx cap run android

# iOS (requiere Mac)
npx cap run ios
```

## 🧪 Cómo Probar

### Escenario 1: App Abierta (Socket.IO)

1. Abre la app como **restaurante**
2. En otra pestaña/dispositivo, crea un pedido como **cliente**
3. **Resultado**: El restaurante ve el pedido aparecer instantáneamente + toast

### Escenario 2: App Cerrada (Push Notification)

1. Cierra completamente la app del **restaurante**
2. Crea un pedido como **cliente**
3. **Resultado**: Llega notificación push al dispositivo del restaurante
4. Toca la notificación
5. **Resultado**: App abre directamente en página de pedidos

### Escenario 3: Cambio de Estado

1. Cliente con app abierta en "Historial de Pedidos"
2. Restaurante cambia estado del pedido a "Preparando"
3. **Resultado**: Cliente ve el cambio instantáneamente + toast

## 📊 Verificar Funcionamiento

### Logs Backend

```bash
# Al crear pedido
✅ [Socket.IO] Evento 'new-order-available' emitido para pedido abc123
✅ [Push Notification] Enviada al restaurante para pedido abc123
📨 Notificación enviada a usuario xyz789: 1 exitosas, 0 fallidas

# Al cambiar estado
✅ [Socket.IO] Estado actualizado para pedido abc123: pending → confirmed
✅ [Push Notification] Enviada al cliente para pedido abc123
```

### Logs Frontend (Console)

```bash
# Al login
📱 Inicializando Push Notifications...
✅ Dispositivo registrado para push notifications
📱 Push token recibido: eXaMpLe...
✅ Token enviado al backend

# Al recibir notificación
🔔 Notificación tocada: { orderId: 'abc123', screen: 'order-detail' }
🧭 Navegando a order-detail abc123
```

## 🎯 Flujo Completo

```
1. Usuario hace LOGIN
   ↓
2. Frontend solicita permisos de notificaciones
   ↓
3. Sistema genera token FCM
   ↓
4. Frontend envía token a backend
   POST /notifications/register-token
   ↓
5. Backend guarda token en DB
   ↓
6. Sistema listo ✅
   ↓

[Cliente crea pedido]
   ↓
7. Backend emite:
   ├─ Socket.IO event (tiempo real)
   └─ Push Notification (app cerrada)
   ↓
8. Restaurante recibe notificación
   ↓
9. Usuario ve pedido o abre app
```

## 📁 Archivos Importantes

### Backend

```
api-server/
├── src/notifications/
│   ├── notifications.service.ts      ⭐ Lógica principal FCM
│   ├── notifications.controller.ts   ⭐ Endpoints REST
│   └── entities/device-token.entity.ts
├── src/orders/orders.service.ts      ⭐ Sistema híbrido
├── firebase-service-account.json     🔐 NO SUBIR A GIT
├── FIREBASE_SETUP.md                 📖 Guía de configuración
└── .env                              🔐 Variables de entorno
```

### Frontend

```
delivery-frontend/
├── src/app/services/
│   ├── push-notification.service.ts  ⭐ Cliente FCM
│   ├── socket.service.ts             ⭐ Cliente Socket.IO
│   └── auth.service.ts               ⭐ Inicialización
├── capacitor.config.ts               ⚙️ Config de Capacitor
├── android/app/
│   └── google-services.json          🔐 NO SUBIR A GIT
├── ios/App/
│   └── GoogleService-Info.plist      🔐 NO SUBIR A GIT
└── PUSH_NOTIFICATIONS_SETUP.md       📖 Guía de configuración
```

## 🔒 Seguridad

### ⚠️ NUNCA subir a Git:

- ❌ `firebase-service-account.json`
- ❌ `google-services.json`
- ❌ `GoogleService-Info.plist`
- ✅ Ya están en `.gitignore`

## 🐛 Troubleshooting

### Backend: "Firebase no está inicializado"

**Solución**:

```bash
# 1. Verificar que existe el archivo
ls api-server/firebase-service-account.json

# 2. Verificar .env
cat api-server/.env | grep FIREBASE

# 3. Reiniciar servidor
cd api-server
npm run start:dev
```

### Frontend: "No recibo notificaciones"

**Solución**:

```bash
# 1. Verificar permisos
# Settings > Apps > Delivery Go Fast > Notifications > ENABLED

# 2. Ver logs
adb logcat | grep Firebase  # Android
# Xcode Console # iOS

# 3. Verificar token en backend
# Check tabla device_tokens en PostgreSQL
```

### "Token no se registra"

**Solución**:

```typescript
// En push-notification.service.ts, agregar más logs
console.log("🔍 Token:", token.value);
console.log(
  "🔍 Enviando a:",
  `${environment.apiUrl}/notifications/register-token`
);
```

## 📚 Documentación Completa

- 📖 **Backend Firebase**: `api-server/FIREBASE_SETUP.md`
- 📖 **Frontend Push**: `delivery-frontend/PUSH_NOTIFICATIONS_SETUP.md`
- 📖 **Sistema Híbrido**: `HYBRID_NOTIFICATIONS_SYSTEM.md`

## 🎉 ¡Listo!

El sistema está completamente implementado y documentado. Solo falta:

1. ✅ Crear proyecto en Firebase
2. ✅ Descargar credenciales
3. ✅ Configurar variables de entorno
4. ✅ Probar en dispositivo real

**¿Dudas?** Revisa la documentación completa en los archivos `.md`
