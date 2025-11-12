# 🔍 GUÍA DE DIAGNÓSTICO - Notificaciones Push

Esta guía te ayudará a diagnosticar por qué no están llegando las notificaciones push.

## ✅ Estado Actual del Sistema

**BUENAS NOTICIAS**: El sistema de notificaciones **SÍ está implementado** y funcionando a nivel de código:

- ✅ Firebase Admin SDK configurado
- ✅ Sistema de eventos implementado (`@OnEvent('order.created')`)
- ✅ Servicio de notificaciones completo
- ✅ Integración con pedidos funcionando
- ✅ Canales de Android configurados

## 🔍 Pasos de Diagnóstico

### Paso 1: Verificar que Firebase está inicializado

```bash
# Desde tu navegador o Postman
curl http://localhost:3000/notifications/health
```

**Respuesta esperada**:

```json
{
  "firebase": "initialized",
  "database": "connected",
  "timestamp": "2025-11-12T..."
}
```

❌ **Si falla**: Revisa que `firebase-service-account.json` existe y es válido.

---

### Paso 2: Verificar que el restaurante tiene tokens registrados

El problema MÁS COMÚN es que **el dueño del restaurante no ha abierto la app móvil**.

#### 2.1 Obtener el token de acceso del restaurante

**Opción A: Desde la app móvil**

1. Abre la app móvil
2. Haz login con el usuario del restaurante
3. Abre el inspector del navegador (Chrome DevTools)
4. Ve a `Application` > `Local Storage`
5. Copia el valor de `access_token`

**Opción B: Desde Postman**

```bash
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "identifier": "locomancocapac@gmail.com",
  "password": "tu_password"
}
```

O también puedes usar el teléfono:

```json
{
  "identifier": "+51987654321",
  "password": "tu_password"
}
```

Copia el `access_token` de la respuesta.

#### 2.2 Verificar tokens del usuario

```bash
# Reemplaza YOUR_TOKEN con el token que obtuviste
curl http://localhost:3000/notifications/my-tokens \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Respuesta esperada SI hay tokens**:

```json
[
  {
    "id": "...",
    "token": "fcm_token_largo...",
    "platform": "android",
    "isActive": true,
    "lastUsedAt": "2025-11-12T...",
    "deviceInfo": {
      "model": "Pixel 8",
      "platform": "android"
    }
  }
]
```

**Respuesta SI NO hay tokens**:

```json
[]
```

#### ⚠️ SI NO HAY TOKENS, EL PROBLEMA ESTÁ AQUÍ

**Solución**:

1. Abre la app móvil en Android Studio
2. Haz login con el usuario del restaurante
3. Verifica en los logs de Logcat:
   ```
   📱 Inicializando Push Notifications...
   📱 Push token recibido: [token]
   ✅ Token enviado al backend
   ```
4. Si aparece **"Permission denied"**, acepta los permisos de notificaciones
5. Si no aparece nada, revisa que `google-services.json` existe en `android/app/`

---

### Paso 3: Enviar una notificación de prueba

```bash
# Reemplaza YOUR_TOKEN con el token del restaurante
curl -X POST http://localhost:3000/notifications/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "🧪 Prueba",
    "body": "Notificación de prueba"
  }'
```

**Respuesta esperada**:

```json
{
  "message": "Notificación de prueba enviada",
  "success": 1,
  "failure": 0
}
```

✅ **Si success > 0**: ¡Las notificaciones están funcionando!
❌ **Si failure > 0**: El token FCM es inválido o expiró

---

### Paso 4: Verificar logs del backend al crear un pedido

1. Crea un pedido desde la app del cliente
2. Revisa los logs del backend (terminal donde corre `npm run start:dev`)

**Logs esperados**:

```
✅ [Socket.IO] Evento 'new-order-available' emitido para pedido abc123
✅ [Event] Evento 'order.created' emitido para pedido abc123
📨 [Event Listener] Procesando evento order.created para pedido abc123
📨 Notificación enviada a usuario xyz789: 1 exitosas, 0 fallidas
✅ [Event Listener] Notificación de nuevo pedido enviada al restaurante xyz789
```

❌ **Si NO ves estos logs**:

- El evento no se está emitiendo
- Revisa que `order.restaurant.owner.id` existe

❌ **Si ves "0 exitosas, 1 fallidas"**:

- El token FCM es inválido
- El usuario no tiene tokens registrados

---

## 🧪 Script de Diagnóstico Automático

Creé un script que hace todo esto automáticamente:

```bash
cd api-server
node test-push-notifications.js YOUR_TOKEN YOUR_USER_ID
```

Ejemplo:

```bash
node test-push-notifications.js eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... f8a2b3c4-5678-90ab-cdef-1234567890ab
```

---

## 🎯 Checklist de Verificación

Marca cada item conforme lo verificas:

- [ ] **Firebase inicializado** (`GET /notifications/health` retorna 200)
- [ ] **App móvil abierta** en el dispositivo del restaurante
- [ ] **Login completado** con usuario del restaurante
- [ ] **Permisos aceptados** (aparece popup de notificaciones)
- [ ] **Token registrado** en backend (verificado con `/my-tokens`)
- [ ] **Notificación de prueba** enviada exitosamente (`POST /notifications/test`)
- [ ] **Logs del backend** muestran evento `order.created`
- [ ] **App en background** (cierra la app pero no la fuerces a cerrar)
- [ ] **Crea un pedido** desde otra app/dispositivo
- [ ] **Notificación aparece** en la barra de notificaciones

---

## 🚨 Problemas Comunes

### 1. "No hay tokens de dispositivo registrados"

**Causa**: El restaurante nunca abrió la app móvil.

**Solución**:

1. Abre la app en un dispositivo Android
2. Haz login con el usuario del restaurante
3. Acepta los permisos de notificaciones
4. Espera a ver en logs: "✅ Token enviado al backend"

---

### 2. "Permission denied" en la app

**Causa**: No se aceptaron los permisos de notificaciones.

**Solución**:

1. Ve a Settings > Apps > Delivery Go Fast > Permissions
2. Habilita "Notifications"
3. Reinicia la app y haz login de nuevo

---

### 3. "Token enviado al backend" pero no aparece en /my-tokens

**Causa**: El backend no está guardando el token.

**Solución**:

1. Revisa los logs del backend al hacer login
2. Busca errores en `NotificationsController.registerToken`
3. Verifica que la base de datos esté funcionando

---

### 4. "1 fallidas" al enviar notificación

**Causa**: El token FCM expiró o es inválido.

**Solución**:

1. Desinstala y vuelve a instalar la app
2. Haz login de nuevo
3. Verifica que se registre un nuevo token

---

### 5. Las notificaciones llegan SOLO con la app abierta

**Causa**: Los canales de Android no están configurados correctamente.

**Solución**:
Ya está solucionado en el código actual. Asegúrate de tener la última versión:

```bash
cd delivery-frontend
npx cap sync android
npx cap run android
```

---

## 📞 Siguiente Paso

**Ejecuta el script de diagnóstico y comparte el resultado**:

```bash
cd api-server
node test-push-notifications.js [TU_TOKEN] [TU_USER_ID]
```

O si prefieres hacerlo manualmente:

1. ¿Qué retorna `GET /notifications/health`?
2. ¿Qué retorna `GET /notifications/my-tokens` (con token del restaurante)?
3. ¿Qué aparece en los logs del backend al crear un pedido?

Con esa información podré ayudarte a identificar exactamente dónde está el problema.
