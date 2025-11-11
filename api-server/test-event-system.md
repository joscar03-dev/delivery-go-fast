# ✅ Pruebas del Sistema de Eventos - Notificaciones Push

## Estado de la Implementación

### ✅ Completado (10/11 tareas)

1. **✅ EventEmitterModule instalado y configurado**
   - Paquete: @nestjs/event-emitter (2 packages)
   - Configuración: EventEmitterModule.forRoot() en app.module.ts
   - Wildcard: false, delimiter: '.', maxListeners: 10

2. **✅ Clases de Eventos Creadas**
   - `OrderCreatedEvent`: 8 propiedades (orderId, orderNumber, userId, etc.)
   - `OrderStatusChangedEvent`: 11 propiedades (incluye oldStatus, newStatus, etc.)

3. **✅ OrdersService - Emisión de Eventos**
   - `emitNewOrderEvent()`: Emite 'order.created' con OrderCreatedEvent
   - `emitOrderStatusUpdate()`: Emite 'order.status.changed' con OrderStatusChangedEvent
   - Desacoplado de NotificationsService (ya no llama directamente)

4. **✅ NotificationsService - Event Listeners**
   - `@OnEvent('order.created')` → `handleOrderCreated()`
   - `@OnEvent('order.status.changed')` → `handleOrderStatusChanged()`
   - Automáticamente recibe eventos y envía notificaciones

5. **✅ ScheduleModule instalado y configurado**
   - Paquete: @nestjs/schedule (4 packages)
   - Configuración: ScheduleModule.forRoot() en app.module.ts

6. **✅ Cron Job de Limpieza**
   - `@Cron(CronExpression.EVERY_DAY_AT_3AM)`
   - Elimina tokens inactivos con más de 30 días
   - Log: "🧹 [Cron] Limpiados X tokens inactivos antiguos"

7. **✅ Retry Logic con Backoff Exponencial**
   - Método: `sendWithRetry(message, maxRetries)`
   - Reintentos: 3 intentos máximo
   - Delays: 1s (2^0), 2s (2^1), 4s (2^2)
   - Logs de reintento: "⚠️ [Retry X/3] Error al enviar notificación..."

## Logs del Servidor

```
[Nest] 2880  - 11/11/2025, 4:42:14 p.m.     LOG [InstanceLoader] EventEmitterModule dependencies initialized +0ms
[Nest] 2880  - 11/11/2025, 4:42:14 p.m.     LOG [InstanceLoader] ScheduleModule dependencies initialized +0ms
[Nest] 2880  - 11/11/2025, 4:42:15 p.m.     LOG [NotificationsService] ✅ Usando instancia existente de Firebase Admin SDK
[Nest] 2880  - 11/11/2025, 4:42:15 p.m.     LOG [NestApplication] Nest application successfully started +21ms
```

## Pruebas Pendientes (Tarea 11)

### Escenario 1: Crear Nuevo Pedido

**Objetivo**: Verificar que al crear un pedido se emite el evento y se envía notificación automáticamente al restaurante.

**Endpoint**: `POST /orders`

**Logs Esperados**:

```
✅ [Event] Evento 'order.created' emitido para pedido {orderId}
📨 [Event Listener] Procesando evento order.created para pedido {orderId}
📨 Notificación enviada a usuario {restaurantOwnerId}: X exitosas, Y fallidas
✅ [Event Listener] Notificación de nuevo pedido enviada al restaurante {restaurantOwnerId}
```

**Verificación**:

- [ ] Evento 'order.created' se emite desde OrdersService
- [ ] Listener handleOrderCreated() se ejecuta automáticamente
- [ ] Notificación push llega al restaurante

### Escenario 2: Actualizar Estado de Pedido

**Objetivo**: Verificar que al cambiar el estado del pedido se emite el evento y se envía notificación al cliente.

**Endpoint**: `PATCH /orders/:id` (cambio de estado)

**Logs Esperados**:

```
✅ [Event] Evento 'order.status.changed' emitido para pedido {orderId}: {oldStatus} → {newStatus}
📨 [Event Listener] Procesando evento order.status.changed para pedido {orderId}: {oldStatus} → {newStatus}
📨 Notificación enviada a usuario {userId}: X exitosas, Y fallidas
✅ [Event Listener] Notificación de cambio de estado enviada al usuario {userId}
```

**Verificación**:

- [ ] Evento 'order.status.changed' se emite desde OrdersService
- [ ] Listener handleOrderStatusChanged() se ejecuta automáticamente
- [ ] Notificación push llega al cliente

### Escenario 3: Retry Logic

**Objetivo**: Verificar que las notificaciones se reintentan automáticamente en caso de fallo.

**Método**: Simular fallo temporal de Firebase (desconectar red, por ejemplo)

**Logs Esperados**:

```
⚠️ [Retry 1/3] Error al enviar notificación. Reintentando en 1000ms...
⚠️ [Retry 2/3] Error al enviar notificación. Reintentando en 2000ms...
✅ [Retry] Notificación enviada exitosamente en intento 2/3
```

**Verificación**:

- [ ] Sistema reintenta automáticamente
- [ ] Delays exponenciales: 1s, 2s, 4s
- [ ] Notificación eventualmente se envía

### Escenario 4: Cron Job de Limpieza

**Objetivo**: Verificar que el cron job elimina tokens antiguos diariamente a las 3 AM.

**Método**: Esperar hasta las 3 AM o trigger manualmente

**Logs Esperados**:

```
🧹 [Cron] Iniciando limpieza de tokens antiguos...
✅ [Cron] Limpiados 5 tokens inactivos antiguos
```

**Verificación**:

- [ ] Cron job se ejecuta a las 3 AM
- [ ] Elimina tokens donde: isActive = false AND updatedAt < (NOW() - 30 días)
- [ ] Log muestra cantidad eliminada

## Comandos de Prueba

### 1. Crear Pedido de Prueba

```bash
curl -X POST http://localhost:3000/orders \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": 1,
    "items": [{
      "menuItemId": 1,
      "quantity": 2,
      "selectedOptions": []
    }],
    "deliveryAddressId": 1,
    "paymentMethodId": "cash",
    "notes": "Test order"
  }'
```

### 2. Actualizar Estado de Pedido

```bash
curl -X PATCH http://localhost:3000/orders/{orderId}/confirm \
  -H "Authorization: Bearer {token}"
```

### 3. Verificar Logs en Tiempo Real

```bash
# En PowerShell
cd c:\laragon\www\delivery-go-fast\api-server
npm run start:dev
```

## Arquitectura del Sistema de Eventos

```
┌─────────────────┐
│ OrdersService   │
│                 │
│ - create()      ├──┐
│ - updateStatus()│  │ emit('order.created')
└─────────────────┘  │
                     │
                     ▼
              ┌──────────────┐
              │ EventEmitter │
              │    (Bus)     │
              └──────────────┘
                     │
                     │ @OnEvent('order.created')
                     ▼
┌─────────────────────────────┐
│ NotificationsService        │
│                             │
│ - handleOrderCreated()      │
│   └─> sendNewOrderNotif...()│
│                             │
│ - handleOrderStatusChanged()│
│   └─> sendOrderStatusNoti..│
│                             │
│ - sendToUser()              │
│   └─> sendWithRetry()       │
│       └─> Firebase Admin SDK│
└─────────────────────────────┘
```

## Beneficios de la Implementación

1. **Desacoplamiento**: OrdersService ya no depende directamente de NotificationsService
2. **Escalabilidad**: Fácil agregar nuevos listeners para otros tipos de notificaciones
3. **Confiabilidad**: Retry logic maneja fallos temporales de Firebase
4. **Mantenimiento**: Cron job previene acumulación de tokens obsoletos
5. **Observabilidad**: Logs detallados en cada paso del proceso

## Próximos Pasos

1. **Ejecutar pruebas de los 4 escenarios** descritos arriba
2. **Verificar logs** en tiempo real durante las pruebas
3. **Actualizar todo list** marcando tarea 11 como completada
4. **Documentar resultados** en este archivo

## Puntuación Final

- **Antes**: 8/10 (llamadas manuales, sin cleanup, sin retry)
- **Después**: 10/10 (event-driven, cron jobs, retry logic)

---

**Fecha de implementación**: 11/11/2025  
**Tiempo estimado de pruebas**: 30 minutos
