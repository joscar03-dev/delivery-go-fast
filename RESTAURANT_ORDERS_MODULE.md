# Módulo de Gestión de Pedidos para Restaurantes

## 📋 Descripción General

Este módulo permite a los dueños de restaurantes gestionar los pedidos recibidos a través de la plataforma. Incluye funcionalidades para visualizar, confirmar, preparar y cancelar pedidos.

## 🎭 Roles y Permisos

### Restaurant Owner (`restaurant_owner`)

- ✅ Ver pedidos de su(s) restaurante(s)
- ✅ Confirmar pedidos pendientes
- ✅ Marcar pedidos como "en preparación"
- ✅ Cancelar pedidos
- ❌ No puede asignar repartidores (solo super_admin)

## 📊 Flujo de Estados de Pedidos

```
1. PENDING (Pendiente)
   ↓ [Restaurante confirma]
2. CONFIRMED (Confirmado)
   ↓ [Restaurante inicia preparación]
3. PREPARING (En Preparación)
   ↓ [Sistema asigna driver automáticamente o admin asigna]
4. OUT_FOR_DELIVERY (En Camino)
   ↓ [Driver entrega]
5. DELIVERED (Entregado)

* En cualquier momento antes de OUT_FOR_DELIVERY:
  → CANCELLED (Cancelado por restaurante o cliente)
```

## 🔗 Endpoints del Backend

### 1. GET /orders

**Descripción:** Obtiene todos los pedidos del restaurante del owner autenticado

**Headers:**

```
Authorization: Bearer {token}
```

**Query Parameters:**

- `status` (opcional): Filtra por estado (pending, confirmed, preparing, etc.)
- `restaurantId` (opcional): Filtra por ID del restaurante

**Response:**

```json
{
  "orders": [
    {
      "id": "uuid",
      "client": { "id": "uuid", "name": "Cliente Name" },
      "restaurant": { "id": "uuid", "name": "Restaurant Name" },
      "status": "pending",
      "total": 45.5,
      "notes": "Sin cebolla",
      "deliveryAddress": "Av. Principal 123",
      "items": [
        {
          "id": "uuid",
          "quantity": 2,
          "price": 15.0,
          "total": 30.0,
          "menuItem": {
            "id": "uuid",
            "name": "Pizza Margarita"
          }
        }
      ],
      "createdAt": "2025-10-31T10:00:00Z",
      "updatedAt": "2025-10-31T10:00:00Z"
    }
  ],
  "total": 1
}
```

### 2. PATCH /orders/:id/confirm

**Descripción:** Confirma un pedido pendiente (PENDING → CONFIRMED)

**Roles permitidos:** `restaurant_owner`, `super_admin`

**Response:**

```json
{
  "id": "uuid",
  "status": "confirmed",
  ...
}
```

### 3. PATCH /orders/:id/preparing

**Descripción:** Marca un pedido como en preparación (CONFIRMED → PREPARING)

**Roles permitidos:** `restaurant_owner`, `super_admin`

**Response:**

```json
{
  "id": "uuid",
  "status": "preparing",
  ...
}
```

### 4. PATCH /orders/:id

**Descripción:** Actualización general del pedido

**Body:**

```json
{
  "status": "cancelled"
}
```

**Validaciones:**

- Restaurant owner solo puede cambiar a: `confirmed`, `preparing`, `cancelled`
- No puede cambiar a estados de driver: `out_for_delivery`, `delivered`

## 💻 Implementación Frontend

### Archivos Creados

1. **`restaurant-orders.page.ts`** - Componente principal

   - Gestiona el estado de la vista
   - Carga y filtra pedidos por estado
   - Maneja acciones (confirmar, preparar, cancelar)
   - Auto-refresh cada 30 segundos

2. **`restaurant-orders.page.html`** - Template

   - Segmentos: Pendientes / En Preparación / Completados
   - Tarjetas de pedido con información completa
   - Botones de acción contextuales según estado

3. **`restaurant-orders.page.scss`** - Estilos
   - Diseño responsive
   - Tarjetas con sombras y colores por estado
   - Badges de estado coloridos

### Servicio de Órdenes (`order.service.ts`)

**Nuevos métodos:**

```typescript
// Confirmar pedido
confirmOrder(orderId: string): Observable<Order>

// Iniciar preparación
startPreparing(orderId: string): Observable<Order>

// Obtener pedidos filtrados
getOrdersByStatus(status?: string, restaurantId?: string): Observable<Order[]>
```

## 🎨 Características de la UI

### Tab en la Barra de Navegación

El módulo está integrado en la barra de tabs inferior:

```
┌─────────────────────────────────────┐
│                                     │
│         (Contenido)                 │
│                                     │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ 🏠    🛒    📋    🍽️    👤         │
│ Rest  Carr Pedi  Pedi  Cuen        │
│ aura  ito  dos   dos   ta          │
│ ntes        (Cliente) (Restaurante) │
└─────────────────────────────────────┘
```

**Visibilidad del Tab:**

- ✅ Solo aparece si el usuario tiene rol `restaurant_owner`
- ✅ Se oculta automáticamente para otros roles
- ✅ Icono: 🍽️ `restaurant-outline`
- ✅ Label: "Pedidos"

### Segmentos (Tabs)

1. **Pendientes** - Pedidos en estado `PENDING`

   - Muestra notificación de nuevos pedidos
   - Botones: "Confirmar Pedido" y "Rechazar"

2. **En Preparación** - Pedidos en estado `PREPARING`

   - Indica que está en cocina
   - Chip visual: "Preparando en cocina..."
   - Botón: "Cancelar" (por emergencias)

3. **Completados** - Pedidos `OUT_FOR_DELIVERY` y `DELIVERED`
   - Vista de historial
   - Solo lectura
   - Badges de estado

### Tarjeta de Pedido

Cada tarjeta muestra:

- 🆔 **ID del pedido** (8 primeros caracteres)
- ⏰ **Fecha/hora** (formato relativo: "Hace 5 min")
- 🏷️ **Badge de estado** (con color)
- 👤 **Cliente** (nombre)
- 📍 **Dirección de entrega**
- 🍕 **Lista de items** (cantidad x producto = precio)
- 📝 **Notas especiales**
- 💰 **Total del pedido**
- 🔘 **Botones de acción** (según estado)

### Colores de Estado

```typescript
PENDING → warning (amarillo)
CONFIRMED → tertiary (morado)
PREPARING → secondary (azul)
OUT_FOR_DELIVERY → primary (celeste)
DELIVERED → success (verde)
CANCELLED → danger (rojo)
```

## 🔄 Auto-Refresh

La página se actualiza automáticamente cada 30 segundos para mostrar nuevos pedidos sin necesidad de recargar manualmente.

```typescript
ngOnInit() {
  this.loadOrders();
  this.refreshSubscription = interval(30000).subscribe(() => {
    this.loadOrders(true); // Silent refresh
  });
}
```

## 🔐 Seguridad y Validaciones

### Frontend

- ✅ Ruta protegida con `authGuard` y `rolesGuard`
- ✅ Solo accesible para rol `restaurant_owner`
- ✅ Confirmación antes de acciones críticas (cancelar)

### Backend

- ✅ Validación de JWT en todos los endpoints
- ✅ Verificación de que el pedido pertenezca al restaurante del owner
- ✅ Validación de transiciones de estado permitidas
- ✅ Solo restaurant_owner puede cambiar a ciertos estados

## 🚀 Cómo Usar

### Para el Restaurant Owner:

1. **Iniciar sesión** como usuario con rol `restaurant_owner`

2. **Acceder a la gestión de pedidos**:

   - **Opción 1 (Recomendada):** Click en el tab "Pedidos" 🍽️ en la barra inferior
   - **Opción 2:** Navegar manualmente a `/restaurant-orders`

3. **Ver pedidos pendientes**:

   - Aparecen automáticamente en el tab "Pendientes"
   - Revisa los detalles del pedido

4. **Confirmar un pedido**:

   - Click en "Confirmar Pedido"
   - Confirma en el diálogo
   - El pedido pasa a estado CONFIRMED

5. **Iniciar preparación**:

   - Ve al tab "Pendientes" o busca el pedido confirmado
   - Click en "Iniciar Preparación"
   - El pedido pasa a estado PREPARING
   - **Ahora los drivers pueden ver este pedido y tomarlo**

6. **Seguimiento**:
   - Una vez que un driver toma el pedido, pasa a "En Camino"
   - Puedes ver el progreso en el tab "Completados"

### Para Testing:

1. **Crear un pedido** (como cliente):

   ```typescript
   POST /orders
   {
     "restaurantId": "restaurant-uuid",
     "items": [...],
     "deliveryAddress": "Av. Test 123"
   }
   ```

2. **Ver el pedido** (como restaurant owner):

   - Aparece en tab "Pendientes"

3. **Confirmar y preparar**:

   - Confirmar → estado CONFIRMED
   - Iniciar preparación → estado PREPARING

4. **Verificar como driver**:
   - El pedido ahora aparece en `/delivery-driver/available`

## 🐛 Troubleshooting

### El restaurante no ve pedidos

**Solución:** Verificar que:

1. El usuario tiene rol `restaurant_owner`
2. El restaurante está correctamente asignado al owner
3. Hay pedidos creados para ese restaurante
4. El filtro de estado es correcto

### Error al confirmar pedido

**Solución:** Verificar que:

1. El pedido está en estado PENDING
2. El pedido pertenece al restaurante del owner
3. El token JWT es válido

### Los drivers no ven el pedido

**Solución:** Verificar que:

1. El pedido está en estado PREPARING
2. El endpoint `/deliveries/available` está funcionando
3. El driver está autenticado correctamente

## 📱 Capturas de Pantalla Esperadas

### Vista de Pendientes

```
┌─────────────────────────────────────┐
│ Gestión de Pedidos                  │
├─────────────────────────────────────┤
│ [Pendientes] [En Preparación] [...] │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Pedido #12345678    [Pendiente] │ │
│ │ ⏰ Hace 5 min                    │ │
│ │ 👤 Cliente: Juan Pérez           │ │
│ │ 📍 Av. Principal 123             │ │
│ │ 🍕 2x Pizza Margarita  S/ 30.00  │ │
│ │ 💰 Total: S/ 30.00               │ │
│ │ ┌─────────────────────────────┐  │ │
│ │ │ ✓ Confirmar Pedido          │  │ │
│ │ └─────────────────────────────┘  │ │
│ │ ┌─────────────────────────────┐  │ │
│ │ │ ✗ Rechazar                  │  │ │
│ │ └─────────────────────────────┘  │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## 🔮 Próximas Mejoras

1. **Notificaciones Push**

   - Notificar cuando llega un nuevo pedido
   - Sonido de alerta

2. **WebSocket para tiempo real**

   - Actualización instantánea de pedidos
   - Ver cuando un driver toma el pedido

3. **Estadísticas**

   - Pedidos por día/semana/mes
   - Ingresos totales
   - Productos más vendidos

4. **Impresión de comandas**

   - Imprimir detalles del pedido
   - Ticket de cocina

5. **Tiempo estimado de preparación**
   - El restaurante puede indicar cuánto tardará
   - El cliente ve el tiempo estimado

## 📚 Referencias

- Endpoint documentation: `/api-server/src/orders/orders.controller.ts`
- Service logic: `/api-server/src/orders/orders.service.ts`
- Frontend page: `/delivery-frontend/src/app/pages/restaurant-orders/`
- Order model: `/delivery-frontend/src/app/models/order.model.ts`
