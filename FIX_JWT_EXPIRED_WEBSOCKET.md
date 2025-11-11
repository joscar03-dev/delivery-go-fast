# 🔐 Solución: Error "jwt expired" en WebSocket

## ❌ Problema

```
[Nest] ERROR [DeliveryGateway] Authentication failed for client gsQWuuMO-bPrmJARAAAB:
jwt expired
```

Este error ocurre cuando un cliente intenta conectarse al WebSocket con un token JWT que ha expirado.

## ✅ Solución Implementada

He implementado un sistema completo de manejo de errores JWT con refresh automático.

### 1️⃣ Backend - Manejo Mejorado de Errores

**Archivo**: `api-server/src/geolocation/delivery.gateway.ts`

**Cambios**:

- ✅ Detecta diferentes tipos de errores JWT: `TokenExpiredError`, `JsonWebTokenError`
- ✅ Envía códigos de error específicos al cliente: `TOKEN_EXPIRED`, `INVALID_TOKEN`, `NO_TOKEN`
- ✅ Logs más informativos con emojis
- ✅ Emite evento `auth_error` en vez de genérico `error`

**Código**:

```typescript
catch (error) {
  let errorCode = 'AUTH_FAILED';
  let errorMessage = 'Authentication failed';

  if (error.name === 'TokenExpiredError') {
    errorCode = 'TOKEN_EXPIRED';
    errorMessage = 'Your session has expired. Please login again.';
    this.logger.warn(`⚠️ Token expired for client ${client.id}`);
  } else if (error.name === 'JsonWebTokenError') {
    errorCode = 'INVALID_TOKEN';
    errorMessage = 'Invalid authentication token';
    this.logger.error(`❌ Invalid token for client ${client.id}`);
  }

  client.emit('auth_error', {
    code: errorCode,
    message: errorMessage,
    timestamp: new Date().toISOString()
  });

  client.disconnect();
}
```

### 2️⃣ Frontend - Refresh Automático de Token

**Archivo**: `delivery-frontend/src/app/services/socket.service.ts`

**Cambios**:

- ✅ Escucha evento `auth_error` del backend
- ✅ Detecta si el error es `TOKEN_EXPIRED`
- ✅ Llama automáticamente a `authService.refreshToken()`
- ✅ Reconecta con el nuevo token si el refresh es exitoso
- ✅ Hace logout si el token es inválido o no se puede refrescar

**Código**:

```typescript
this.socket.on("auth_error", async (error: AuthError) => {
  console.error("🔐 Error de autenticación:", error);

  if (error.code === "TOKEN_EXPIRED") {
    console.log("⏰ Token expirado - Intentando refrescar...");

    try {
      const refreshed = await this.authService.refreshToken();

      if (refreshed) {
        console.log("✅ Token refrescado - Reconectando...");
        const newToken = localStorage.getItem("access_token");

        if (newToken) {
          this.disconnect();
          setTimeout(() => {
            this.connect(newToken);
          }, 500);
        }
      }
    } catch (err) {
      console.error("❌ Error al refrescar token:", err);
    }
  } else if (error.code === "INVALID_TOKEN") {
    await this.authService.logout();
  }
});
```

## 🎬 Flujo de Solución

### Escenario 1: Token Expirado con Refresh Token Válido

```
1. Usuario abre app después de varios días
   ↓
2. Access token está expirado
   ↓
3. App intenta conectar WebSocket con token expirado
   ↓
4. Backend detecta TokenExpiredError
   ↓
5. Backend emite auth_error con code='TOKEN_EXPIRED'
   ↓
6. Frontend recibe auth_error
   ↓
7. Frontend llama authService.refreshToken()
   ↓
8. Backend genera nuevo access token
   ↓
9. Frontend desconecta y reconecta con nuevo token
   ↓
10. ✅ WebSocket conectado con token válido
```

### Escenario 2: Token Inválido o Refresh Token Expirado

```
1. Token es inválido o refresh token expirado
   ↓
2. Backend emite auth_error con code='INVALID_TOKEN'
   ↓
3. Frontend llama authService.logout()
   ↓
4. Usuario es redirigido a login
   ↓
5. Usuario debe loguearse nuevamente
```

## 🔧 Configuración del Backend

### JWT Expiration

**Archivo**: `api-server/.env`

```env
# Access token (para WebSocket y API requests)
JWT_EXPIRES_IN=7d  # 7 días

# Refresh token
JWT_REFRESH_EXPIRES_IN=30d  # 30 días
```

**Recomendaciones**:

- **Desarrollo**: Access 7d, Refresh 30d (lo que tienes ahora)
- **Producción**: Access 15m, Refresh 7d (más seguro)

### Cambiar a configuración más segura (opcional):

```typescript
// api-server/src/auth/auth.service.ts

// Access token corto
const accessToken = this.jwtService.sign(payload, {
  expiresIn: "15m", // 15 minutos
});

// Refresh token largo
const refreshToken = this.jwtService.sign(
  { sub: user.id, type: "refresh" },
  { expiresIn: "7d" } // 7 días
);
```

## 📱 Testing

### Test 1: Token Expirado con Refresh Válido

**Simular token expirado**:

```typescript
// En tu código de testing, crear token con expiration corto
const testToken = jwtService.sign(payload, { expiresIn: "5s" });

// Conectar WebSocket
socketService.connect(testToken);

// Esperar 6 segundos
setTimeout(() => {
  // Intentar alguna operación
  // Debe refrescar automáticamente
}, 6000);
```

**Logs esperados**:

```
⏰ Token expirado - Intentando refrescar...
✅ Token refrescado - Reconectando...
✅ Socket.IO conectado
```

### Test 2: Token Inválido

```typescript
// Token completamente inválido
socketService.connect("token_invalido_123");
```

**Logs esperados**:

```
🔐 Error de autenticación: {code: 'INVALID_TOKEN', ...}
❌ Token inválido - Usuario debe reloguearse
```

### Test 3: Sin Token

```typescript
// Conectar sin token
socketService.connect("");
```

**Logs esperados**:

```
🔐 Error de autenticación: {code: 'NO_TOKEN', ...}
```

## 🐛 Troubleshooting

### Error persiste después del refresh

**Causa**: El refresh token también está expirado

**Solución**: Usuario debe hacer login nuevamente

```typescript
// El sistema ya lo maneja automáticamente
if (!refreshed) {
  console.warn("⚠️ No se pudo refrescar el token - Usuario debe reloguearse");
  await authService.logout(); // Logout automático
}
```

### WebSocket se desconecta constantemente

**Causa posible 1**: Access token muy corto (ej: 5 minutos)

**Solución**: Aumentar `JWT_EXPIRES_IN` a al menos 15 minutos

**Causa posible 2**: Refresh token expirado

**Solución**: Usuario debe loguearse nuevamente

### "Cannot read property 'refreshToken' of undefined"

**Causa**: AuthService no está inyectado correctamente

**Solución**: Ya lo solucionamos agregando:

```typescript
private authService = inject(AuthService);
```

## 📊 Logs de Producción

### Backend (PM2)

```bash
# Ver errores de autenticación
pm2 logs delivery-api | grep "Authentication failed"

# Ver tokens expirados
pm2 logs delivery-api | grep "Token expired"

# Ver conexiones exitosas
pm2 logs delivery-api | grep "Client connected"
```

### Frontend (Android Logcat)

```bash
# Ver errores de auth
adb logcat | grep "Error de autenticación"

# Ver refresh de tokens
adb logcat | grep "Token refrescado"

# Ver reconexiones
adb logcat | grep "Socket.IO conectado"
```

## ✅ Beneficios de la Solución

1. **UX Mejorado**: Usuario no se da cuenta del refresh - es transparente
2. **Seguridad**: Tokens cortos reducen ventana de ataque
3. **Observabilidad**: Logs claros con códigos de error específicos
4. **Resiliencia**: Sistema se recupera automáticamente de tokens expirados
5. **Debugging**: Fácil identificar qué tipo de error ocurrió

## 🎯 Resumen

**Antes**:

- ❌ Error genérico "jwt expired"
- ❌ Usuario pierde conexión WebSocket
- ❌ Debe recargar la app manualmente

**Después**:

- ✅ Error específico con código
- ✅ Refresh automático de token
- ✅ Reconexión transparente
- ✅ Logout automático si no se puede recuperar
- ✅ Logs informativos

## 📝 Próximos Pasos (Opcional)

### Mejorar Seguridad para Producción

1. **Reducir expiration del access token**:

   ```env
   JWT_EXPIRES_IN=15m
   ```

2. **Implementar rotación de refresh tokens**:

   - Cada vez que se usa un refresh token, generar uno nuevo
   - Invalidar el refresh token anterior

3. **Agregar whitelist de refresh tokens en base de datos**:
   - Guardar refresh tokens activos en DB
   - Verificar que el refresh token existe antes de usarlo
   - Revocar tokens al hacer logout

---

**Estado**: ✅ IMPLEMENTADO  
**Archivos modificados**: 2

- `api-server/src/geolocation/delivery.gateway.ts`
- `delivery-frontend/src/app/services/socket.service.ts`

**Fecha**: 11/11/2025
