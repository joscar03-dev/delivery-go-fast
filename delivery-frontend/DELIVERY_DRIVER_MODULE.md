# Módulo de Repartidores - Delivery Go Fast

Este módulo permite a los repartidores gestionar las entregas de pedidos en tiempo real.

## 🚀 Características

- ✅ Ver pedidos disponibles para entregar
- ✅ Aceptar pedidos y asignarlos al repartidor
- ✅ Seguimiento del estado del pedido (Recogido → En camino → Entregado)
- ✅ Notificaciones en tiempo real de nuevos pedidos (Socket.IO)
- ✅ Navegación con Google Maps al restaurante y dirección de entrega
- ⏳ Seguimiento de ubicación en tiempo real (pendiente de habilitar)

## 📦 Dependencias Necesarias

### Socket.IO Client (Notificaciones en tiempo real)

Para habilitar las notificaciones en tiempo real, instala Socket.IO client:

\`\`\`bash
cd delivery-frontend
npm install socket.io-client
\`\`\`

Luego, en `src/app/services/socket.service.ts`, descomenta las siguientes líneas:

\`\`\`typescript
// Cambiar esto:
// import { io, Socket } from 'socket.io-client';
declare const io: any;
type Socket = any;

// Por esto:
import { io, Socket } from 'socket.io-client';
// declare const io: any;
// type Socket = any;
\`\`\`

### Capacitor Geolocation (Seguimiento de ubicación)

Para habilitar el seguimiento de ubicación del repartidor:

\`\`\`bash
cd delivery-frontend
npm install @capacitor/geolocation
npx cap sync
\`\`\`

Luego, en `src/app/pages/delivery-driver/active-delivery/active-delivery.page.ts`:

1. Descomenta el import:
   \`\`\`typescript
   import { Geolocation } from '@capacitor/geolocation';
   \`\`\`

2. Descomenta el código en el método `startLocationTracking()`

## 🗂️ Estructura de Archivos

\`\`\`
src/app/
├── services/
│ ├── delivery.service.ts # Servicio para API de deliveries
│ └── socket.service.ts # Servicio para Socket.IO
└── pages/
└── delivery-driver/
├── available-deliveries/ # Página de pedidos disponibles
│ ├── available-deliveries.page.ts
│ ├── available-deliveries.page.html
│ └── available-deliveries.page.scss
└── active-delivery/ # Página de entrega activa
├── active-delivery.page.ts
├── active-delivery.page.html
└── active-delivery.page.scss
\`\`\`

## 🔐 Permisos y Roles

Las páginas de repartidor están protegidas por el rol `delivery_driver`. Solo los usuarios con este rol pueden acceder a estas páginas.

### Rutas del módulo:

- `/delivery-driver/available` - Lista de pedidos disponibles
- `/delivery-driver/active` - Entrega activa del repartidor

## 🎯 Flujo de Trabajo del Repartidor

1. **Ver Pedidos Disponibles** (`/delivery-driver/available`)

   - El repartidor ve una lista de pedidos disponibles
   - Recibe notificaciones en tiempo real cuando hay nuevos pedidos
   - Puede ver detalles como restaurante, dirección, monto, distancia

2. **Aceptar Pedido**

   - Al hacer clic en "Aceptar Pedido", el pedido se asigna al repartidor
   - Navega automáticamente a la página de entrega activa

3. **Gestionar Entrega Activa** (`/delivery-driver/active`)

   - Ve los detalles completos del pedido
   - Actualiza el estado paso a paso:
     - Confirmado
     - En preparación
     - Listo para recoger
     - **Recogido** (repartidor marca cuando recoge del restaurante)
     - **En camino** (repartidor inicia el viaje)
     - **Entregado** (repartidor confirma la entrega)
   - Puede navegar al restaurante o dirección de entrega con Google Maps

4. **Completar Entrega**
   - Al marcar como "Entregado", regresa a pedidos disponibles
   - Puede aceptar un nuevo pedido

## 🔔 Notificaciones en Tiempo Real

El módulo usa Socket.IO para notificaciones en tiempo real:

- **Conexión automática**: Al entrar a la página de pedidos disponibles
- **Indicador de estado**: Muestra si está conectado o desconectado
- **Notificación de nuevos pedidos**: Toast notification con opción de ver
- **Recarga automática**: La lista se actualiza automáticamente

### Eventos Socket.IO que escucha:

- `new-order-available` - Nuevo pedido disponible para repartidores
- `order-status-updated` - Estado de pedido actualizado
- `delivery-location-updated` - Ubicación de repartidor actualizada

## 📱 API Endpoints Utilizados

### Deliveries

- `GET /deliveries/available` - Obtener pedidos disponibles
- `POST /deliveries/:orderId/accept` - Aceptar un pedido
- `GET /deliveries/active` - Obtener entrega activa del repartidor
- `POST /deliveries/:orderId/location` - Actualizar ubicación del repartidor
- `POST /deliveries/:orderId/cancel` - Cancelar entrega

### Orders

- `PUT /orders/:id/status` - Actualizar estado del pedido

## 🎨 Componentes UI

- **Cards**: Para mostrar información de pedidos
- **Chips**: Para indicadores de estado y monto
- **Progress Timeline**: Para el flujo de estados del pedido
- **Pull-to-refresh**: Para actualizar la lista de pedidos
- **Toasts**: Para notificaciones y feedback
- **Alerts**: Para confirmaciones de acciones

## 🚧 Próximas Mejoras

- [ ] Mapa en tiempo real mostrando ubicación del repartidor
- [ ] Historial de entregas completadas
- [ ] Estadísticas de entregas (cantidad, ganancias, tiempo promedio)
- [ ] Chat en tiempo real con el cliente
- [ ] Cámara para tomar foto de confirmación de entrega
- [ ] Firma digital del cliente
- [ ] Modo offline para áreas sin conexión

## 🐛 Troubleshooting

### Socket.IO no se conecta

- Verifica que el backend esté corriendo
- Verifica que la URL en `environment.ts` sea correcta
- Verifica que el token JWT sea válido
- Revisa la consola del navegador para errores

### No aparecen pedidos disponibles

- Verifica que haya pedidos en estado adecuado en el backend
- Verifica que el usuario tenga el rol `delivery_driver`
- Intenta refrescar con el botón de refresh o pull-to-refresh

### Error al aceptar pedido

- El pedido puede haber sido aceptado por otro repartidor
- Verifica la conexión a internet
- Refresca la lista de pedidos disponibles
