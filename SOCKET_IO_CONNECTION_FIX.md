# Fix: Socket.IO "Desconectado" en módulo de Repartidores

## Problema Identificado

Al entrar como usuario con rol `driver` y acceder al módulo de entregas (ícono de bicicleta), aparecía el estado "Desconectado" en lugar de "En línea", impidiendo recibir notificaciones en tiempo real.

## Causas del Problema

### 1. Namespace Incorrecto

- **Backend:** El gateway estaba configurado con namespace `/delivery`
- **Frontend:** El cliente Socket.IO se conectaba a la raíz `/`
- **Resultado:** No había coincidencia, la conexión fallaba

### 2. Extracción de Token

- **Frontend:** Enviaba el token usando la opción `auth: { token: 'Bearer ...' }`
- **Backend:** Buscaba el token en `client.handshake.headers.authorization`
- **Resultado:** El backend no encontraba el token y rechazaba la conexión

## Soluciones Implementadas

### Frontend: socket.service.ts

**Archivo:** `delivery-frontend/src/app/services/socket.service.ts`

#### Antes:

```typescript
this.socket = io(environment.apiUrl, {
  auth: {
    token: `Bearer ${token}`,
  },
  // ...
});
```

#### Después:

```typescript
this.socket = io(`${environment.apiUrl}/delivery`, {
  auth: {
    token: `Bearer ${token}`,
  },
  // ...
});
```

**Cambio:** Agregado namespace `/delivery` a la URL de conexión.

### Backend: delivery.gateway.ts

**Archivo:** `api-server/src/geolocation/delivery.gateway.ts`

#### Antes:

```typescript
private extractTokenFromClient(client: Socket): string | null {
  const authHeader = client.handshake.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  // ...
}
```

#### Después:

```typescript
private extractTokenFromClient(client: Socket): string | null {
  // Intentar extraer token desde el objeto auth (Socket.IO cliente)
  const authToken = client.handshake.auth?.token as string;
  if (authToken) {
    // Si viene con 'Bearer ', extraerlo
    if (authToken.startsWith('Bearer ')) {
      return authToken.substring(7);
    }
    return authToken;
  }

  // Fallback a métodos anteriores para compatibilidad
  const authHeader = client.handshake.headers.authorization;
  // ...
}
```

**Cambio:** Primero busca el token en `client.handshake.auth.token`, luego en headers como fallback.

## Configuración del Gateway

```typescript
@WebSocketGateway({
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
  namespace: "/delivery", // ← Namespace específico
})
export class DeliveryGateway {
  // ...
}
```

## Flujo de Conexión Actualizado

1. **Driver inicia sesión** → Obtiene JWT token
2. **Navega a entregas disponibles** → Componente llama `socketService.connect(token)`
3. **Socket.IO se conecta** → `http://localhost:3000/delivery` con token en auth
4. **Backend valida token** → Extrae de `handshake.auth.token`
5. **Asigna información** → `client.userId`, `client.userRole`
6. **Une a salas** → Sala de `drivers` para notificaciones
7. **Estado cambia** → `isSocketConnected = true` → Muestra "En línea" ✅

## Eventos Socket.IO Disponibles

### Del Backend al Driver:

- `new-order-available` - Nuevo pedido disponible para aceptar
- `order-status-updated` - Estado de un pedido actualizado
- `delivery-location-updated` - Ubicación de repartidor actualizada

### Del Driver al Backend:

- `driverLocationUpdate` - Actualizar ubicación del repartidor
- `requestActiveDrivers` - Solicitar lista de repartidores activos

## Pruebas

### 1. Verificar Conexión

```typescript
// En la consola del navegador, deberías ver:
🔌 Socket conectado - Escuchando nuevos pedidos
✅ Socket.IO conectado
```

### 2. Estado Visual

- El chip en la barra superior debe mostrar:
  - 🟢 "En línea" (color verde) cuando está conectado
  - 🔴 "Desconectado" (color rojo) cuando no hay conexión

### 3. Logs del Backend

```
[DeliveryGateway] Client connected: abcd1234 (User: driver@example.com, Role: driver)
```

## Troubleshooting

### Si sigue mostrando "Desconectado":

1. **Verificar que el backend esté corriendo:**

   ```bash
   cd api-server
   npm run start:dev
   ```

2. **Verificar el token en localStorage:**

   ```javascript
   // En la consola del navegador
   localStorage.getItem("token");
   ```

3. **Verificar logs de la consola:**

   - Buscar errores de Socket.IO
   - Verificar URL de conexión
   - Verificar que el token sea válido

4. **Verificar CORS:**

   - El backend debe permitir `http://localhost:8100`
   - Verificar en `main.ts`

5. **Verificar namespace:**
   - Frontend: `io('http://localhost:3000/delivery', ...)`
   - Backend: `@WebSocketGateway({ namespace: '/delivery' })`

## Dependencias Requeridas

### Backend:

```json
{
  "@nestjs/websockets": "^10.x",
  "@nestjs/platform-socket.io": "^10.x",
  "socket.io": "^4.x"
}
```

### Frontend:

```json
{
  "socket.io-client": "^4.x"
}
```

## Próximos Pasos

- [ ] Implementar reconexión automática con feedback al usuario
- [ ] Agregar manejo de errores de conexión
- [ ] Implementar heartbeat para detectar conexiones muertas
- [ ] Agregar indicador de latencia de conexión
- [ ] Implementar cola de mensajes para cuando no hay conexión

## Fecha de Implementación

31 de octubre de 2025
