# 📊 Plan de Implementación: Dashboard para Restaurantes

## 🎯 Objetivo

Crear un dashboard interactivo que muestre estadísticas en tiempo real del restaurante, incluyendo pedidos, ingresos, repartidores, y métricas de rendimiento.

---

## 📋 Funcionalidades del Dashboard

### 1. **Resumen de Estadísticas (Cards superiores)**

- 📦 **Pedidos Hoy**: Número total de pedidos del día
- 💰 **Ingresos Hoy**: Total de ventas del día
- 🚴 **Repartidores Activos**: Drivers actualmente en entregas
- ⏱️ **Tiempo Promedio de Preparación**: Métrica de eficiencia

### 2. **Gráfico de Pedidos por Estado (Pie Chart)**

- Distribución visual de pedidos:
  - Pendientes
  - En preparación
  - Listos para recoger
  - En camino
  - Entregados
  - Cancelados

### 3. **Gráfico de Ingresos por Día (Line Chart)**

- Evolución de ingresos en los últimos 7 días
- Comparación con semana anterior (opcional)

### 4. **Tabla de Pedidos Activos**

- Lista de pedidos en curso
- Actualización en tiempo real vía WebSocket
- Estados: Pendiente, Confirmado, En preparación, En camino

### 5. **Lista de Repartidores Activos**

- Drivers asignados a pedidos del restaurante
- Estado actual de cada delivery
- Tiempo estimado de entrega

### 6. **Métricas Adicionales**

- ⭐ Producto más vendido del día
- 📍 Zona de entrega más frecuente
- ⏰ Hora pico de pedidos

---

## 🏗️ Arquitectura Técnica

### Backend (NestJS)

#### Nuevo Endpoint: GET /api/restaurants/:id/dashboard

```typescript
{
  summary: {
    ordersToday: number;
    revenueToday: number;
    activeDrivers: number;
    avgPrepTime: number;
  },
  ordersByStatus: {
    pending: number;
    confirmed: number;
    preparing: number;
    ready_for_pickup: number;
    out_for_delivery: number;
    delivered: number;
    cancelled: number;
  },
  revenueByDay: [
    { date: '2025-11-06', revenue: 850.50 },
    { date: '2025-11-07', revenue: 920.00 },
    // ... últimos 7 días
  ],
  activeOrders: Order[],
  activeDrivers: {
    driverId: string;
    driverName: string;
    orderId: string;
    status: string;
    estimatedDeliveryTime: string;
  }[],
  topProducts: {
    productName: string;
    quantity: number;
    revenue: number;
  }[]
}
```

#### Servicio: RestaurantDashboardService

- Método para calcular estadísticas del día
- Queries optimizadas con agregaciones SQL
- Caché para métricas que no cambian constantemente

### Frontend (Ionic/Angular)

#### Nueva Página: restaurant-dashboard.page.ts

- Componente standalone
- Integración con SocketService para actualizaciones en tiempo real
- Uso de Chart.js o ng2-charts para gráficos

#### Componentes a Crear:

1. **StatCard**: Tarjeta de estadística individual
2. **PieChart**: Gráfico circular para pedidos por estado
3. **LineChart**: Gráfico de líneas para ingresos
4. **ActiveOrdersTable**: Tabla compacta de pedidos activos
5. **ActiveDriversList**: Lista de repartidores

---

## 📦 Dependencias Necesarias

### Frontend

```bash
npm install chart.js ng2-charts --save
npm install @types/chart.js --save-dev
```

### Backend

- No requiere dependencias adicionales (usar TypeORM agregaciones)

---

## 🔄 Flujo de Datos en Tiempo Real

```
1. Usuario abre Dashboard
   ↓
2. Frontend carga datos iniciales (HTTP GET)
   ↓
3. Frontend se conecta a WebSocket
   ↓
4. Backend emite eventos cuando:
   - Nuevo pedido creado → Actualiza "Pedidos Hoy"
   - Pedido cambia de estado → Actualiza gráfico de estados
   - Pedido completado → Actualiza "Ingresos Hoy"
   - Driver acepta pedido → Actualiza "Repartidores Activos"
   ↓
5. Frontend actualiza dashboard automáticamente
```

---

## 📱 Diseño UI/UX

### Layout Responsivo

```
┌─────────────────────────────────────────────┐
│  📊 Dashboard - Mi Restaurante              │
├─────────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│  │ 📦   │ │ 💰   │ │ 🚴   │ │ ⏱️   │       │
│  │ 25   │ │S/850 │ │  3   │ │ 15min│       │
│  │Pedidos│ │Ventas│ │Activos│ │Prep │       │
│  └──────┘ └──────┘ └──────┘ └──────┘       │
├─────────────────────────────────────────────┤
│  ┌─────────────────┐ ┌─────────────────┐   │
│  │ Pedidos Estado  │ │ Ingresos 7 días │   │
│  │   (Pie Chart)   │ │  (Line Chart)   │   │
│  │                 │ │                 │   │
│  └─────────────────┘ └─────────────────┘   │
├─────────────────────────────────────────────┤
│  📋 Pedidos Activos (Tabla)                │
│  ┌─────────────────────────────────────┐   │
│  │ #12AB | Cliente | S/45 | En prep   │   │
│  │ #34CD | María   | S/65 | En camino │   │
│  └─────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│  🚴 Repartidores Activos                   │
│  ┌─────────────────────────────────────┐   │
│  │ Juan Pérez | Pedido #12AB | 10 min │   │
│  │ Ana López  | Pedido #34CD | 15 min │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### Colores del Dashboard

- **Primary**: Información general
- **Success**: Pedidos completados, ingresos
- **Warning**: Pedidos pendientes
- **Danger**: Pedidos cancelados
- **Medium**: Datos secundarios

---

## 🚀 Plan de Implementación

### Fase 1: Backend (Endpoints y Servicios)

1. ✅ Crear `RestaurantDashboardController`
2. ✅ Crear `RestaurantDashboardService`
3. ✅ Implementar queries para estadísticas
4. ✅ Crear DTOs para respuestas
5. ✅ Agregar validaciones y permisos

### Fase 2: Frontend (UI Base)

1. ✅ Crear página `restaurant-dashboard`
2. ✅ Instalar Chart.js y ng2-charts
3. ✅ Crear componentes de estadísticas
4. ✅ Diseñar layout responsivo

### Fase 3: Integración en Tiempo Real

1. ✅ Conectar WebSocket para actualizaciones
2. ✅ Implementar auto-refresh de métricas
3. ✅ Optimizar rendimiento

### Fase 4: Mejoras y Optimización

1. ⚠️ Agregar filtros por fecha
2. ⚠️ Exportar reportes (PDF/Excel)
3. ⚠️ Notificaciones de alertas (pedidos pendientes > 5 min)
4. ⚠️ Comparación con períodos anteriores

---

## 📊 Queries SQL Necesarias

### Pedidos del Día

```sql
SELECT COUNT(*)
FROM orders
WHERE restaurant_id = :restaurantId
  AND DATE(created_at) = CURRENT_DATE
```

### Ingresos del Día

```sql
SELECT SUM(total)
FROM orders
WHERE restaurant_id = :restaurantId
  AND DATE(created_at) = CURRENT_DATE
  AND status IN ('delivered')
```

### Pedidos por Estado

```sql
SELECT status, COUNT(*) as count
FROM orders
WHERE restaurant_id = :restaurantId
  AND DATE(created_at) = CURRENT_DATE
GROUP BY status
```

### Ingresos por Día (últimos 7 días)

```sql
SELECT
  DATE(created_at) as date,
  SUM(total) as revenue
FROM orders
WHERE restaurant_id = :restaurantId
  AND created_at >= CURRENT_DATE - INTERVAL '7 days'
  AND status = 'delivered'
GROUP BY DATE(created_at)
ORDER BY date ASC
```

### Repartidores Activos

```sql
SELECT DISTINCT
  u.id,
  u.name,
  o.id as order_id,
  o.status
FROM orders o
JOIN users u ON o.driver_id = u.id
WHERE o.restaurant_id = :restaurantId
  AND o.status IN ('out_for_delivery', 'ready_for_pickup')
```

---

## ✅ Checklist de Implementación

### Backend

- [ ] Crear `dashboard.controller.ts`
- [ ] Crear `dashboard.service.ts`
- [ ] Crear DTOs para respuestas
- [ ] Implementar queries con TypeORM
- [ ] Agregar guards de autenticación
- [ ] Testing de endpoints

### Frontend

- [ ] Instalar Chart.js
- [ ] Crear página dashboard
- [ ] Crear componente StatCard
- [ ] Crear componente PieChart
- [ ] Crear componente LineChart
- [ ] Crear componente ActiveOrdersTable
- [ ] Crear componente ActiveDriversList
- [ ] Integrar WebSocket
- [ ] Diseño responsivo
- [ ] Testing en dispositivos

### Integración

- [ ] Conectar frontend con backend
- [ ] Implementar auto-refresh
- [ ] Optimizar consultas
- [ ] Agregar loading states
- [ ] Manejo de errores

---

## 🎨 Mockup de Datos (para testing)

```typescript
const mockDashboardData = {
  summary: {
    ordersToday: 25,
    revenueToday: 850.5,
    activeDrivers: 3,
    avgPrepTime: 15,
  },
  ordersByStatus: {
    pending: 2,
    confirmed: 3,
    preparing: 5,
    ready_for_pickup: 2,
    out_for_delivery: 3,
    delivered: 8,
    cancelled: 2,
  },
  revenueByDay: [
    { date: "2025-11-06", revenue: 750 },
    { date: "2025-11-07", revenue: 820 },
    { date: "2025-11-08", revenue: 680 },
    { date: "2025-11-09", revenue: 950 },
    { date: "2025-11-10", revenue: 890 },
    { date: "2025-11-11", revenue: 920 },
    { date: "2025-11-12", revenue: 850 },
  ],
};
```

---

## 📈 Métricas de Éxito

- ⚡ Tiempo de carga del dashboard: < 2 segundos
- 🔄 Actualización en tiempo real: < 1 segundo
- 📱 Responsivo en móvil, tablet y desktop
- ♿ Accesible (ARIA labels)
- 🎨 Diseño intuitivo y profesional

---

**¿Comenzamos con la implementación?** 🚀
