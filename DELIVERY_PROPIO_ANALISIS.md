# 📊 Análisis del Sistema de Delivery Propio

## 🔍 Estado Actual del Sistema

### Tipos de Delivery Implementados

El sistema actualmente soporta **3 tipos de delivery**:

1. **`none`** - Solo retiro en tienda (pickup)
2. **`restaurant`** - Delivery propio del restaurante ⚠️ **INCOMPLETO**
3. **`platform`** - Delivery gestionado por Go Fast (plataforma)

---

## ⚠️ PROBLEMA CRÍTICO: Delivery Propio No Tiene Flujo de Asignación

### ❌ Lo que FALTA en el Delivery Propio (`restaurant`)

Actualmente, cuando un restaurante configura **delivery propio**, el sistema:

✅ **Lo que SÍ funciona:**

- Permite al restaurante configurar tarifas de delivery
- Permite al restaurante configurar umbral de delivery gratis
- Permite al restaurante confirmar y preparar pedidos
- Permite al restaurante marcar pedidos como "listos para recoger"

❌ **Lo que NO funciona:**

- **NO HAY forma de asignar un repartidor propio del restaurante**
- **NO HAY módulo para gestionar repartidores del restaurante**
- **NO HAY interfaz para que el restaurante asigne manualmente un driver**
- Los pedidos se quedan en `ready_for_pickup` esperando un driver que nunca llega

### 🎯 Flujo Actual vs. Flujo Esperado

#### Flujo de Delivery Plataforma (`platform`) - ✅ FUNCIONA

```
1. Cliente hace pedido → status: PENDING
2. Restaurante confirma → status: CONFIRMED
3. Drivers de Go Fast ven pedido en "/deliveries/available"
4. Driver acepta pedido → status: PREPARING, driver asignado
5. Restaurante cocina
6. Restaurante marca listo → status: READY_FOR_PICKUP
7. Driver recoge → status: OUT_FOR_DELIVERY
8. Driver entrega → status: DELIVERED
```

#### Flujo de Delivery Propio (`restaurant`) - ⚠️ INCOMPLETO

```
1. Cliente hace pedido → status: PENDING
2. Restaurante confirma → status: CONFIRMED
3. ⚠️ ¿Quién asigna el driver? (NO EXISTE INTERFAZ)
4. ⚠️ Pedidos se quedan sin driver asignado
5. Restaurante cocina
6. Restaurante marca listo → status: READY_FOR_PICKUP
7. ❌ NO HAY driver asignado, pedido se queda atascado
8. ❌ Cliente espera indefinidamente
```

---

## 🛠️ ANÁLISIS TÉCNICO

### Backend - Endpoints Disponibles

#### ✅ Endpoint para SUPER_ADMIN (existe pero no es práctico)

```typescript
// api-server/src/orders/orders.controller.ts
@Patch(':id/assign-driver')
@Roles(Role.SUPER_ADMIN)  // ⚠️ Solo SUPER_ADMIN puede asignar
assignDriver(
  @Param('id') orderId: string,
  @Body('driverId') driverId: string,
) {
  return this.ordersService.assignDriver(orderId, driverId);
}
```

**Problemas:**

- Solo el SUPER_ADMIN puede usar este endpoint
- El RESTAURANT_OWNER NO puede asignar sus propios repartidores
- No hay lista de "repartidores del restaurante" en la base de datos

### Frontend - Interfaz del Restaurante

#### ❌ NO EXISTE componente de asignación de drivers

En `restaurant-orders.page.html`:

```html
<!-- Pedido Listo para Recoger -->
<div *ngIf="order.status === 'ready_for_pickup'" class="button-group">
  <ion-chip color="success" class="full-width-chip">
    <ion-icon name="checkmark-circle-outline"></ion-icon>
    <ion-label>¡Pedido listo! Esperando driver...</ion-label>
  </ion-chip>
  <!-- ⚠️ NO HAY BOTÓN PARA ASIGNAR DRIVER -->
</div>
```

---

## 💡 SUGERENCIAS Y SOLUCIONES

### Opción 1: Sistema Simple - Asignación Manual por Restaurante (RECOMENDADO)

#### Descripción

Permitir que el restaurante tenga una lista de repartidores propios y pueda asignarlos manualmente.

#### Ventajas

- ✅ Simple de implementar
- ✅ El restaurante tiene control total
- ✅ No requiere nueva entidad de relación restaurant-driver

#### Implementación

##### 1. Modificar Base de Datos (Opcional)

```sql
-- Agregar campo para identificar drivers de restaurantes específicos
ALTER TABLE users
ADD COLUMN restaurant_id UUID REFERENCES restaurants(id);

-- Los drivers con restaurant_id NO NULL son repartidores propios
-- Los drivers con restaurant_id NULL son de la plataforma
```

##### 2. Crear Endpoint para Asignar Driver (Backend)

```typescript
// api-server/src/orders/orders.controller.ts

@Patch(':id/assign-restaurant-driver')
@Roles(Role.RESTAURANT_OWNER, Role.SUPER_ADMIN)
async assignRestaurantDriver(
  @Param('id') orderId: string,
  @Body('driverId') driverId: string,
  @Request() req,
) {
  const currentUser = req.user;
  return this.ordersService.assignRestaurantDriver(
    orderId,
    driverId,
    currentUser.id,
    currentUser.role
  );
}
```

```typescript
// api-server/src/orders/orders.service.ts

async assignRestaurantDriver(
  orderId: string,
  driverId: string,
  ownerId: string,
  ownerRole: Role
): Promise<Order> {
  // Buscar el pedido
  const order = await this.orderRepository.findOne({
    where: { id: orderId },
    relations: ['restaurant', 'restaurant.owner', 'driver'],
  });

  if (!order) {
    throw new NotFoundException('Order not found');
  }

  // Verificar que el pedido sea del restaurante del owner
  if (ownerRole === Role.RESTAURANT_OWNER) {
    if (order.restaurant.owner.id !== ownerId) {
      throw new ForbiddenException('You can only assign drivers to your own restaurant orders');
    }
  }

  // Verificar que el pedido esté en estado válido para asignación
  const validStatuses = [
    OrderStatus.CONFIRMED,
    OrderStatus.PREPARING,
    OrderStatus.READY_FOR_PICKUP,
  ];

  if (!validStatuses.includes(order.status)) {
    throw new BadRequestException(
      'Order must be CONFIRMED, PREPARING, or READY_FOR_PICKUP to assign driver'
    );
  }

  // Verificar que el driver sea válido
  const driver = await this.userRepository.findOne({
    where: { id: driverId },
    relations: ['role'],
  });

  if (!driver || driver.role.name !== Role.DRIVER) {
    throw new BadRequestException('Invalid driver ID');
  }

  // Asignar el driver
  order.driver = driver;

  // Si el pedido estaba CONFIRMED, cambiarlo a PREPARING
  if (order.status === OrderStatus.CONFIRMED) {
    order.status = OrderStatus.PREPARING;
  }

  const updatedOrder = await this.orderRepository.save(order);

  // Emitir evento de actualización
  this.emitOrderStatusUpdate(updatedOrder.id, updatedOrder.status);

  // Enviar notificación al driver
  await this.notificationsService.notifyDriverAssigned(driverId, orderId);

  return updatedOrder;
}
```

##### 3. Crear Servicio para Gestionar Drivers del Restaurante (Frontend)

```typescript
// delivery-frontend/src/app/services/restaurant.service.ts

// Obtener repartidores del restaurante
getRestaurantDrivers(restaurantId: string): Observable<User[]> {
  return this.http.get<User[]>(
    `${this.base}/restaurants/${restaurantId}/drivers`
  );
}

// Asignar driver a pedido
assignDriverToOrder(orderId: string, driverId: string): Observable<Order> {
  return this.http.patch<Order>(
    `${this.base}/orders/${orderId}/assign-restaurant-driver`,
    { driverId }
  );
}
```

##### 4. Actualizar UI - Botón de Asignación de Driver

```html
<!-- delivery-frontend/src/app/pages/restaurant-orders/restaurant-orders.page.html -->

<!-- Pedidos Confirmados o En Preparación SIN driver asignado -->
<div
  *ngIf="(order.status === 'confirmed' || order.status === 'preparing') && !order.driver"
  class="button-group"
>
  <ion-chip color="warning">
    <ion-icon name="warning-outline"></ion-icon>
    <ion-label>Sin repartidor asignado</ion-label>
  </ion-chip>

  <!-- NUEVO BOTÓN: Asignar Repartidor -->
  <ion-button expand="block" color="primary" (click)="assignDriver(order)">
    <ion-icon slot="start" name="person-add-outline"></ion-icon>
    Asignar Repartidor
  </ion-button>

  <ion-button expand="block" color="success" (click)="markAsReady(order)">
    <ion-icon slot="start" name="checkmark-done-outline"></ion-icon>
    Listo para Recoger
  </ion-button>
</div>

<!-- Pedidos CON driver asignado -->
<div
  *ngIf="(order.status === 'confirmed' || order.status === 'preparing') && order.driver"
  class="button-group"
>
  <ion-chip color="success">
    <ion-icon name="checkmark-circle-outline"></ion-icon>
    <ion-label>Repartidor: {{ order.driver.name }}</ion-label>
  </ion-chip>

  <ion-button expand="block" color="success" (click)="markAsReady(order)">
    <ion-icon slot="start" name="checkmark-done-outline"></ion-icon>
    Listo para Recoger
  </ion-button>
</div>
```

##### 5. Método en Componente para Asignar Driver

```typescript
// delivery-frontend/src/app/pages/restaurant-orders/restaurant-orders.page.ts

async assignDriver(order: Order) {
  // Primero, obtener lista de drivers del restaurante
  const drivers = await this.restaurantService
    .getRestaurantDrivers(this.currentRestaurantId)
    .toPromise();

  if (!drivers || drivers.length === 0) {
    await this.showToast(
      'No tienes repartidores registrados. Contacta al administrador.',
      'warning'
    );
    return;
  }

  // Crear inputs para el alert (radio buttons con drivers)
  const inputs = drivers.map(driver => ({
    type: 'radio',
    label: `${driver.name} (${driver.email})`,
    value: driver.id,
  }));

  const alert = await this.alertCtrl.create({
    header: 'Asignar Repartidor',
    message: `Selecciona un repartidor para el pedido #${order.id.substring(0, 8)}`,
    inputs: inputs,
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel',
      },
      {
        text: 'Asignar',
        handler: async (driverId) => {
          if (!driverId) {
            await this.showToast('Debes seleccionar un repartidor', 'warning');
            return false;
          }

          try {
            this.loading = true;
            await this.restaurantService
              .assignDriverToOrder(order.id, driverId)
              .toPromise();

            await this.showToast('Repartidor asignado correctamente', 'success');
            await this.loadOrders();
          } catch (error: any) {
            console.error('Error assigning driver:', error);
            await this.showToast(
              error?.error?.message || 'Error al asignar repartidor',
              'danger'
            );
          } finally {
            this.loading = false;
          }
        },
      },
    ],
  });

  await alert.present();
}
```

---

### Opción 2: Sistema Intermedio - Lista de Drivers por Defecto

#### Descripción

El restaurante puede configurar una lista de drivers "favoritos" o "predeterminados" y el sistema los asigna automáticamente en orden.

#### Ventajas

- ✅ Automatizado, no requiere intervención manual
- ✅ Más rápido para restaurantes ocupados

#### Desventajas

- ❌ Más complejo de implementar
- ❌ Requiere lógica de disponibilidad de drivers
- ❌ Puede asignar drivers que estén ocupados

---

### Opción 3: Sistema Avanzado - Pool de Drivers del Restaurante

#### Descripción

Sistema similar al de Go Fast pero interno del restaurante. Los drivers del restaurante aceptan pedidos desde su propia interfaz.

#### Ventajas

- ✅ Más escalable
- ✅ Los drivers pueden ver todos los pedidos pendientes
- ✅ Sistema de aceptación similar a Go Fast

#### Desventajas

- ❌ Muy complejo de implementar
- ❌ Requiere duplicar toda la lógica de deliveries
- ❌ Necesita nueva interfaz para drivers de restaurantes

---

## 🎯 RECOMENDACIÓN FINAL

**Implementar Opción 1: Asignación Manual Simple**

### Por qué:

1. **Rápido de implementar** - Puede estar lista en 2-4 horas
2. **Suficiente para la mayoría de restaurantes** - Los restaurantes pequeños no tienen tantos pedidos simultáneos
3. **Control total** - El restaurante decide quién entrega cada pedido
4. **No requiere nueva infraestructura** - Usa la tabla de users existente
5. **Fácil de probar y validar** - Menos código = menos bugs

### Flujo Propuesto:

```
[RESTAURANTE con delivery propio]
│
├─ 1. Registra drivers en el sistema (SUPER_ADMIN ayuda)
│     └─ Drivers tienen role=DRIVER y restaurant_id=X
│
├─ 2. Pedido llega (status: PENDING)
│
├─ 3. Restaurante confirma (status: CONFIRMED)
│     └─ Aparece botón "Asignar Repartidor"
│
├─ 4. Restaurante clickea "Asignar Repartidor"
│     └─ Modal muestra lista de drivers del restaurante
│     └─ Selecciona un driver
│     └─ Status cambia a PREPARING, driver asignado
│
├─ 5. Restaurante cocina y marca "Listo" (status: READY_FOR_PICKUP)
│
├─ 6. Driver recibe notificación push
│     └─ Driver usa app de deliveries normal
│     └─ Ve el pedido en "Mis Entregas Activas"
│
├─ 7. Driver recoge (status: OUT_FOR_DELIVERY)
│
└─ 8. Driver entrega (status: DELIVERED)
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Backend (NestJS)

- [ ] Agregar campo `restaurant_id` a tabla `users` (opcional pero recomendado)
- [ ] Crear endpoint `PATCH /orders/:id/assign-restaurant-driver`
- [ ] Implementar método `assignRestaurantDriver()` en `orders.service.ts`
- [ ] Crear endpoint `GET /restaurants/:id/drivers`
- [ ] Implementar validación: solo RESTAURANT_OWNER puede asignar a sus pedidos
- [ ] Agregar notificación push cuando se asigna driver

### Frontend (Angular/Ionic)

- [ ] Agregar método `assignDriverToOrder()` en `restaurant.service.ts`
- [ ] Agregar método `getRestaurantDrivers()` en `restaurant.service.ts`
- [ ] Agregar botón "Asignar Repartidor" en `restaurant-orders.page.html`
- [ ] Implementar modal de selección de driver en `restaurant-orders.page.ts`
- [ ] Mostrar información del driver asignado en la tarjeta del pedido
- [ ] Actualizar estado en tiempo real cuando se asigna driver (Socket.IO)

### Testing

- [ ] Probar asignación manual de driver
- [ ] Verificar notificaciones push al driver
- [ ] Verificar que driver solo ve pedidos asignados a él
- [ ] Probar flujo completo: confirmar → asignar → cocinar → listo → entregar
- [ ] Verificar que no se puede asignar driver a pedidos de otro restaurante

---

## 🚀 PRÓXIMOS PASOS

1. **Confirmar la opción elegida** con el equipo
2. **Implementar backend** (endpoints y validaciones)
3. **Implementar frontend** (UI de asignación)
4. **Probar flujo completo** con restaurante de prueba
5. **Documentar** el nuevo flujo en documentación de usuario

---

## 📝 NOTAS ADICIONALES

### ¿Qué pasa si el restaurante tiene tipo `none` (solo pickup)?

- No se muestra interfaz de asignación de drivers
- Los pedidos permanecen sin driver
- Cliente recoge directamente en el restaurante

### ¿Qué pasa si el restaurante cambia de `restaurant` a `platform`?

- Los drivers propios ya no verán los pedidos del restaurante
- Los nuevos pedidos irán a la plataforma Go Fast
- Los pedidos antiguos se mantienen con el driver asignado

### ¿Pueden los drivers trabajar para varios restaurantes?

- Sí, si tienen `restaurant_id = NULL` (drivers de plataforma)
- No, si tienen `restaurant_id` específico (exclusivos de un restaurante)
- Se puede implementar relación many-to-many si se requiere flexibilidad
