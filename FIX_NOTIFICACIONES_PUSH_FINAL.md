# 🔧 FIX: Notificaciones Push - Correcciones Aplicadas

## 📋 Problemas Encontrados y Solucionados

### ✅ **Problema #1: userId null al registrar token**

**Error**: `null value in column "user_id" violates not-null constraint`

**Causa**: El JWT no incluía `userId` en el payload decodificado.

**Solución**:

- ✅ Actualizada la estrategia JWT (`jwt.strategy.ts`) para incluir `userId: payload.sub`
- ✅ Agregada validación en el controlador para verificar que `userId` existe

---

### ✅ **Problema #2: Evento `order.created` no se emite**

**Error**: No se enviaban notificaciones al crear pedidos.

**Causa**: La relación `restaurant.owner` no se estaba cargando en `checkout()`.

**Solución**:

```typescript
// orders.service.ts - línea 400
relations: [
  'client',
  'restaurant',
  'restaurant.owner', // ⬅️ AGREGADO
  'driver',
  'items',
  'items.menuItem',
],
```

---

### 🔍 **Problema #3: Tokens FCM fallan inmediatamente**

**Síntoma**: `0 exitosas, 1 fallidas` al enviar notificación de prueba.

**Posibles causas**:

1. ❓ `google-services.json` no coincide con Firebase Console
2. ❓ Firebase Cloud Messaging no está habilitado
3. ❓ El token se genera en ambiente de desarrollo pero se envía desde producción

**Solución aplicada**:

- ✅ Agregados logs detallados para ver el error exacto de Firebase
- 🔍 Ahora verás: `❌ Token X falló: [ERROR_CODE] - [ERROR_MESSAGE]`

---

## 🚀 Pasos para Subir al VPS

### 1. Commit y Push

```bash
cd c:\laragon\www\delivery-go-fast
git add .
git commit -m "fix: corregir notificaciones push - agregar restaurant.owner relation y logs detallados"
git push origin main
```

### 2. En el VPS

```bash
# Conectar al VPS
ssh user@gofastdelivery.site

# Navegar al proyecto
cd /var/www/delivery-go-fast

# Pull de los cambios
git pull origin main

# Backend
cd api-server
npm install
npm run build
pm2 restart delivery-api

# Verificar logs
pm2 logs delivery-api --lines 50
```

### 3. Verificar el Fix

```bash
# Prueba 1: Verificar que Firebase está OK
curl https://api.gofastdelivery.site/notifications/health

# Prueba 2: Crear un pedido y revisar logs
pm2 logs delivery-api --lines 100

# Deberías ver:
# ✅ [Socket.IO] Evento 'new-order-available' emitido
# ✅ [Event] Evento 'order.created' emitido
# 📨 [Event Listener] Procesando evento order.created
# 📨 Notificación enviada a usuario XXX: 1 exitosas, 0 fallidas
# ✅ [Event Listener] Notificación de nuevo pedido enviada
```

---

## 🎯 Pruebas Recomendadas

### **Paso 1: Probar notificación de prueba**

```bash
# Con Postman o curl
POST https://api.gofastdelivery.site/notifications/test
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "title": "🧪 Prueba Fix",
  "body": "Probando correcciones"
}
```

**Resultado esperado**:

```json
{
  "message": "Notificación de prueba enviada",
  "success": 1,
  "failure": 0
}
```

**Si falla (success: 0)**, revisa los logs:

```bash
pm2 logs delivery-api | grep "Token.*falló"
```

Verás algo como:

```
❌ Token 1 falló: messaging/invalid-registration-token - The registration token is not valid
```

Esto te dirá **exactamente** qué está mal.

---

### **Paso 2: Probar creación de pedido**

1. **Dispositivo 1 (Restaurante)**:

   - Abre la app
   - Login con usuario restaurante
   - Minimiza la app (no la cierres)

2. **Dispositivo 2 (Cliente)**:

   - Abre la app
   - Login con usuario cliente
   - Crea un pedido en el restaurante

3. **Verificar logs en VPS**:

```bash
pm2 logs delivery-api --lines 30
```

**Logs esperados**:

```
✅ [Socket.IO] Evento 'new-order-available' emitido para pedido XXX
✅ [Event] Evento 'order.created' emitido para pedido XXX
📨 [Event Listener] Procesando evento order.created para pedido XXX
📨 Notificación enviada a usuario YYY: 1 exitosas, 0 fallidas
✅ [Event Listener] Notificación de nuevo pedido enviada al restaurante YYY
```

4. **Verificar en Dispositivo 1**:
   - ✅ Debería aparecer notificación: "🔔 Nuevo Pedido #XXXX"

---

## 🔍 Diagnóstico si sigue fallando

### **Si el token sigue fallando:**

#### Opción A: Verificar configuración de Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona proyecto "delivery-go-fast"
3. Ve a "Project Settings" > "Cloud Messaging"
4. Verifica que **Cloud Messaging API está habilitado**
5. Verifica que el **Server Key** existe

#### Opción B: Regenerar google-services.json

1. En Firebase Console > "Project Settings"
2. Baja a "Your apps" > Android app
3. Click en "Download google-services.json"
4. Reemplaza el archivo en `delivery-frontend/android/app/google-services.json`
5. Sincroniza:
   ```bash
   cd delivery-frontend
   npx cap sync android
   ```

#### Opción C: Verificar que los project_id coinciden

```bash
# Backend
grep "project_id" api-server/firebase-service-account.json

# Frontend
grep "project_id" delivery-frontend/android/app/google-services.json

# Deben ser IGUALES: "delivery-go-fast"
```

---

## 📝 Resumen de Cambios

| Archivo                                                           | Cambio                               | Propósito                   |
| ----------------------------------------------------------------- | ------------------------------------ | --------------------------- |
| `api-server/src/auth/jwt.strategy.ts`                             | Agregado `userId: payload.sub`       | Pasar userId al request     |
| `api-server/src/notifications/notifications.controller.ts`        | Validación de `userId`               | Prevenir errores null       |
| `api-server/src/orders/orders.service.ts`                         | Agregado `restaurant.owner` relation | Cargar owner para evento    |
| `api-server/src/notifications/notifications.service.ts`           | Logs detallados de errores           | Diagnosticar fallos de FCM  |
| `delivery-frontend/src/app/services/push-notification.service.ts` | Validación de token antes de enviar  | No intentar si no hay token |

---

## ✅ Checklist Final

Antes de subir al VPS:

- [x] Commit de todos los cambios
- [ ] Push al repositorio
- [ ] Pull en el VPS
- [ ] Build y restart del backend
- [ ] Verificar logs de inicio
- [ ] Probar notificación de prueba
- [ ] Probar creación de pedido
- [ ] Verificar notificación llega al restaurante

---

## 🆘 Si necesitas ayuda

Comparte los logs después de hacer las pruebas:

```bash
# Logs del backend
pm2 logs delivery-api --lines 50

# O buscar errores específicos
pm2 logs delivery-api | grep -E "Error|falló|Failed"
```

Con esos logs puedo ayudarte a identificar exactamente qué está fallando.
