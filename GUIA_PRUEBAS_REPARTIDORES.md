# Guía de Pruebas - Integración Frontend de Repartidores

## Fecha: 31 de octubre de 2025

Esta guía describe cómo probar la integración completa del módulo de repartidores después de las mejoras implementadas.

---

## Prerrequisitos

1. **Backend en ejecución:**

   ```powershell
   cd C:\laragon\www\delivery-go-fast\api-server
   npm run dev
   ```

2. **Frontend en ejecución:**

   ```powershell
   cd C:\laragon\www\delivery-go-fast\delivery-frontend
   npm start
   ```

3. **Usuarios de prueba:**
   - Repartidor con credenciales válidas
   - Cliente con credenciales válidas (para crear pedidos)

---

## Pruebas a Realizar

### 1. Autenticación y Conexión WebSocket ✅

**Objetivo:** Verificar que el repartidor se conecta correctamente al WebSocket

**Pasos:**

1. Iniciar sesión como repartidor en la app
2. Navegar a la página "Pedidos Disponibles"
3. Verificar que aparece el indicador "En línea" (verde) en la esquina superior derecha

**Resultado Esperado:**

- ✅ Indicador verde "En línea" visible
- ✅ En consola del navegador: `✅ Socket.IO conectado`
- ✅ En consola del backend: `Client connected: [socket-id] (User: [email], Role: driver)`

**Validación en Backend:**
Buscar en logs del servidor:

```
Client connected: abc123 (User: driver@example.com, Role: driver)
```

---

### 2. Ver Pedidos Disponibles ✅

**Objetivo:** Verificar que el repartidor puede ver la lista de pedidos disponibles

**Pasos:**

1. Como cliente, crear un pedido nuevo (estado: `confirmed`)
2. Como repartidor, refrescar la lista de pedidos disponibles
3. Verificar que el nuevo pedido aparece en la lista

**Resultado Esperado:**

- ✅ Lista de pedidos cargada correctamente
- ✅ Cada pedido muestra:
  - Nombre del restaurante
  - Dirección de recogida
  - Dirección de entrega
  - Estado del pedido
  - Botón "Aceptar Pedido"

**Validación en Consola:**

```
Pedidos recibidos: [{...}, {...}]
```

---

### 3. Notificación de Nuevo Pedido en Tiempo Real ✅

**Objetivo:** Verificar que el repartidor recibe notificación cuando hay un nuevo pedido

**Pasos:**

1. Como repartidor, estar en la página "Pedidos Disponibles"
2. Como cliente (en otra ventana/dispositivo), crear un nuevo pedido
3. Observar si aparece una notificación en la app del repartidor

**Resultado Esperado:**

- ✅ Notificación tipo toast aparece en la parte superior
- ✅ Mensaje: "🔔 Nuevo pedido disponible: [Nombre del Restaurante]"
- ✅ Botón "Ver" en la notificación
- ✅ Lista se recarga automáticamente

**Validación en Consola:**

```
🔔 Nuevo pedido disponible: {orderId: "...", restaurantName: "..."}
```

---

### 4. Aceptar un Pedido ✅

**Objetivo:** Verificar que el repartidor puede aceptar un pedido

**Pasos:**

1. En la lista de pedidos disponibles, hacer clic en "Aceptar Pedido"
2. Observar la navegación a la página "Entrega Activa"

**Resultado Esperado:**

- ✅ Toast de éxito: "Pedido aceptado exitosamente"
- ✅ Navegación automática a `/delivery-driver/active`
- ✅ Detalles del pedido cargados correctamente

**Validación en Backend:**
En logs:

```
Driver [driver-id] accepted order [order-id]
```

---

### 5. Conexión WebSocket en Entrega Activa ✅

**Objetivo:** Verificar que el socket se conecta y une a la sala del pedido

**Pasos:**

1. Después de aceptar un pedido, estar en la página "Entrega Activa"
2. Verificar indicador de conexión

**Resultado Esperado:**

- ✅ Indicador verde "Conectado" en la esquina superior derecha
- ✅ En consola del navegador: `🔌 Socket conectado - Uniéndose a sala del pedido`

**Validación en Backend:**

```
User [driver-id] joined room for order [order-id]
```

---

### 6. Envío de Ubicación por WebSocket ✅ (NUEVA FUNCIONALIDAD)

**Objetivo:** Verificar que la ubicación del repartidor se envía mediante WebSocket

**Pasos:**

1. Estar en la página "Entrega Activa"
2. Permitir permisos de ubicación cuando se soliciten
3. Observar consola del navegador cada 30 segundos

**Resultado Esperado:**

- ✅ Permiso de ubicación solicitado y otorgado
- ✅ En consola del navegador: `📍 Seguimiento de ubicación iniciado`
- ✅ Cada 30 segundos: `📍 Ubicación del repartidor enviada: {...}`
- ✅ Cada 30 segundos: `📍 Ubicación enviada: [lat], [lng]`
- ✅ Confirmación del servidor: `✅ Ubicación actualizada correctamente: {...}`

**Validación en Backend:**

```
Location updated for driver [driver-id]
Location update sent for order [order-id]
```

**Datos Enviados (verificar en consola del navegador):**

```javascript
{
  orderId: "uuid-del-pedido",
  latitude: -12.0464,
  longitude: -77.0428,
  heading: 45,      // opcional
  speed: 15,        // opcional (km/h)
  accuracy: 10      // metros
}
```

---

### 7. Actualización de Estado del Pedido ✅

**Objetivo:** Verificar que el repartidor puede actualizar el estado del pedido

**Pasos:**

1. En "Entrega Activa", hacer clic en "Marcar como Recogido (e Iniciar Entrega)"
2. Confirmar la acción
3. Luego, hacer clic en "Marcar como Entregado"
4. Confirmar la acción

**Resultado Esperado:**

**Al marcar como "Recogido":**

- ✅ Alerta de confirmación aparece
- ✅ Estado cambia a `out_for_delivery`
- ✅ Toast: "Estado actualizado exitosamente"
- ✅ Progreso visual actualizado

**Al marcar como "Entregado":**

- ✅ Alerta de confirmación aparece
- ✅ Estado cambia a `delivered`
- ✅ Toast: "Estado actualizado exitosamente"
- ✅ Seguimiento de ubicación se detiene: `📍 Seguimiento de ubicación detenido`
- ✅ Navegación automática a "Pedidos Disponibles" después de 2 segundos

**Validación en Backend:**

```
Order [order-id] status updated to out_for_delivery by driver [driver-id]
Order [order-id] status updated to delivered by driver [driver-id]
```

---

### 8. Navegación a Google Maps ✅

**Objetivo:** Verificar que los botones de navegación funcionan

**Pasos:**

1. En "Entrega Activa", hacer clic en "Abrir en Maps" (Restaurante)
2. Luego, hacer clic en "Abrir en Maps" (Dirección de entrega)

**Resultado Esperado:**

- ✅ Se abre Google Maps con la ruta al restaurante
- ✅ Se abre Google Maps con la ruta a la dirección de entrega

---

### 9. Desconexión del WebSocket ✅

**Objetivo:** Verificar que el socket se desconecta correctamente al salir

**Pasos:**

1. Estar en "Entrega Activa"
2. Hacer clic en el botón "Atrás" para volver a "Pedidos Disponibles"
3. Observar consola

**Resultado Esperado:**

- ✅ En consola del navegador: `📍 Seguimiento de ubicación detenido`
- ✅ Socket sale de la sala del pedido

**Validación en Backend:**

```
User [driver-id] left room for order [order-id]
```

---

### 10. Manejo de Errores ✅

**Objetivo:** Verificar que los errores se manejan correctamente

**Escenarios a probar:**

#### A. Pérdida de conexión a Internet

1. Desconectar Internet mientras está en "Entrega Activa"
2. Reconectar Internet

**Resultado Esperado:**

- ✅ Indicador cambia a rojo "Desconectado"
- ✅ Al reconectar, indicador cambia a verde "Conectado"
- ✅ Socket se reconecta automáticamente

#### B. Pedido ya aceptado por otro repartidor

1. Intentar aceptar un pedido que ya fue aceptado

**Resultado Esperado:**

- ✅ Toast de error: "Error al aceptar el pedido. Puede que ya haya sido tomado."
- ✅ Lista de pedidos se recarga automáticamente

#### C. Sin permisos de ubicación

1. Denegar permisos de ubicación
2. Intentar aceptar un pedido

**Resultado Esperado:**

- ✅ Toast: "Se requieren permisos de ubicación para el seguimiento"
- ✅ No se envía ubicación

---

## Herramientas de Debugging

### Consola del Navegador (Chrome DevTools)

**Filtrar por categoría:**

- `📍` - Ubicación
- `✅` - Éxito
- `❌` - Error
- `🔌` - WebSocket
- `🔔` - Notificaciones

**Comandos útiles:**

```javascript
// Ver estado del socket
localStorage.getItem("access_token");

// Ver usuario actual
jwt_decode(localStorage.getItem("access_token"));
```

### Network Tab

**Verificar peticiones WebSocket:**

1. Ir a Network > WS (WebSocket)
2. Seleccionar conexión a `/delivery`
3. Ver mensajes enviados/recibidos en tiempo real

**Buscar:**

- `driverLocationUpdate` (enviado cada 30 segundos)
- `locationUpdated` (confirmación del servidor)
- `joinOrderRoom` (al entrar a entrega activa)
- `orderLocationUpdate` (actualización de ubicación para clientes)

### Logs del Backend

**Filtrar por categoría:**

```bash
# Ver solo logs de WebSocket
npm run dev | grep "DeliveryGateway"

# Ver actualizaciones de ubicación
npm run dev | grep "Location updated"

# Ver conexiones
npm run dev | grep "connected"
```

---

## Checklist Final de Validación

Antes de considerar la integración completa, verificar:

- [ ] ✅ Repartidor puede iniciar sesión
- [ ] ✅ Socket se conecta automáticamente al entrar a "Pedidos Disponibles"
- [ ] ✅ Indicador de conexión funciona correctamente
- [ ] ✅ Lista de pedidos se carga sin errores
- [ ] ✅ Notificaciones de nuevos pedidos llegan en tiempo real
- [ ] ✅ Repartidor puede aceptar pedidos
- [ ] ✅ Navegación a "Entrega Activa" funciona
- [ ] ✅ Socket se une a la sala del pedido
- [ ] ✅ Permisos de ubicación se solicitan
- [ ] ✅ **Ubicación se envía por WebSocket cada 30 segundos**
- [ ] ✅ **Confirmación de ubicación recibida del servidor**
- [ ] ✅ Repartidor puede actualizar estado a "Recogido"
- [ ] ✅ Repartidor puede actualizar estado a "Entregado"
- [ ] ✅ Seguimiento de ubicación se detiene al completar entrega
- [ ] ✅ Navegación a Google Maps funciona
- [ ] ✅ Socket se desconecta correctamente al salir
- [ ] ✅ Reconexión automática funciona

---

## Problemas Conocidos y Soluciones

### Problema: "Socket no conectado"

**Síntoma:** Indicador rojo "Desconectado"

**Soluciones:**

1. Verificar que el backend está corriendo
2. Verificar que el token JWT es válido
3. Verificar configuración de CORS en el backend
4. Revisar consola de errores

### Problema: "No se envía ubicación"

**Síntoma:** No aparece `📍 Ubicación enviada` en consola

**Soluciones:**

1. Verificar permisos de ubicación del navegador
2. Asegurarse de estar en "Entrega Activa"
3. Verificar que `activeOrder` no es null
4. Verificar conexión del socket

### Problema: "Ubicación se envía pero no llega al backend"

**Síntoma:** Aparece en consola del navegador pero no en backend

**Soluciones:**

1. Verificar Network > WS > Messages
2. Asegurarse que el evento es `driverLocationUpdate` (no otro)
3. Verificar que el backend tiene el listener correcto
4. Revisar logs del backend para errores

---

## Próximos Pasos (Futuras Mejoras)

1. **Pantalla de seguimiento para clientes:**

   - Crear `OrderTrackingPage` en el módulo de cliente
   - Mostrar mapa con ubicación del repartidor en tiempo real
   - Conectar al socket y unirse a sala del pedido
   - Escuchar evento `orderLocationUpdate`

2. **Optimizaciones:**

   - Ajustar intervalo de actualización según velocidad del repartidor
   - Implementar batching de actualizaciones de ubicación
   - Agregar estimación de tiempo de llegada (ETA)

3. **Testing:**
   - Agregar pruebas E2E con Cypress/Playwright
   - Pruebas unitarias para SocketService
   - Pruebas de integración para DeliveryGateway

---

**Documento creado:** 31 de octubre de 2025  
**Versión:** 1.0  
**Autor:** GitHub Copilot
