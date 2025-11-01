# Fix: Error 404 en /deliveries/active y pedido persistente

**Fecha:** 31 de octubre de 2025  
**Tipo:** Bug Fix

---

## 🐛 Problemas Identificados

### 1. Error 404: GET /deliveries/active

**Síntoma:**

```
GET http://localhost:3000/deliveries/active 404 (Not Found)
```

**Causa:**

- El frontend llamaba a `/deliveries/active`
- El backend solo tenía el endpoint `/deliveries/my-active`

### 2. Pedido persistente después de aceptarlo

**Síntoma:**

- Al hacer clic en "Aceptar Pedido", el pedido se aceptaba correctamente
- Pero seguía apareciendo en la lista de pedidos disponibles
- Solo desaparecía al recargar la página manualmente

**Causa:**

- No se removía el pedido del array local `availableOrders[]` después de aceptarlo
- La UI no se actualizaba hasta que se recargaba la lista completa

---

## ✅ Soluciones Implementadas

### Fix 1: Corregir endpoint en `delivery.service.ts`

**Archivo:** `delivery-frontend/src/app/services/delivery.service.ts`

**Antes:**

```typescript
getActiveDelivery(): Observable<DeliveryOrder | null> {
  return this.http.get<DeliveryOrder | null>(`${this.baseUrl}/active`);
}
```

**Después:**

```typescript
getActiveDelivery(): Observable<DeliveryOrder | null> {
  return this.http.get<DeliveryOrder | null>(`${this.baseUrl}/my-active`);
}
```

**Cambio:** `active` → `my-active` para coincidir con el endpoint del backend.

---

### Fix 2: Remover pedido de la lista inmediatamente

**Archivo:** `delivery-frontend/src/app/pages/delivery-driver/available-deliveries/available-deliveries.page.ts`

**Antes:**

```typescript
async acceptDelivery(order: DeliveryOrder) {
  const sub = this.deliveryService.acceptDelivery(order.id).subscribe({
    next: async (response) => {
      const toast = await this.toast.create({
        message: response.message || 'Pedido aceptado exitosamente',
        duration: 1500,
        color: 'success',
      });
      await toast.present();

      // Navegar a la página de entrega activa
      this.router.navigate(['/delivery-driver/active'], {
        state: { order: response.order },
      });
    },
    // ...
  });
}
```

**Después:**

```typescript
async acceptDelivery(order: DeliveryOrder) {
  const sub = this.deliveryService.acceptDelivery(order.id).subscribe({
    next: async (response) => {
      // Remover el pedido de la lista inmediatamente
      this.availableOrders = this.availableOrders.filter(o => o.id !== order.id);

      const toast = await this.toast.create({
        message: response.message || 'Pedido aceptado exitosamente',
        duration: 1500,
        color: 'success',
      });
      await toast.present();

      // Navegar a la página de entrega activa
      this.router.navigate(['/delivery-driver/active'], {
        state: { order: response.order },
      });
    },
    // ...
  });
}
```

**Cambio:** Agregada línea para filtrar el pedido aceptado del array local.

---

## 🧪 Cómo Probar

### Prueba 1: Verificar endpoint correcto

1. Aceptar un pedido
2. Navegar a "Entrega Activa"
3. **Resultado esperado:** NO debe aparecer error 404 en consola
4. **Resultado esperado:** La página carga correctamente

### Prueba 2: Verificar remoción inmediata

1. Ir a "Pedidos Disponibles" con varios pedidos en la lista
2. Hacer clic en "Aceptar Pedido" en uno de ellos
3. **Resultado esperado:** El pedido desaparece INMEDIATAMENTE de la lista
4. **Resultado esperado:** No es necesario recargar para ver el cambio
5. **Resultado esperado:** Navega a "Entrega Activa" con el pedido correcto

---

## 📊 Endpoints del Backend

Para referencia, estos son los endpoints disponibles en el controlador de deliveries:

| Método | Endpoint                      | Descripción                              |
| ------ | ----------------------------- | ---------------------------------------- |
| GET    | `/deliveries/available`       | Listar pedidos disponibles               |
| POST   | `/deliveries/:orderId/accept` | Aceptar un pedido                        |
| GET    | `/deliveries/my-active`       | ✅ Obtener entrega activa del repartidor |
| GET    | `/deliveries/my-history`      | Obtener historial de entregas            |

**Nota:** No existe `/deliveries/active`, el correcto es `/deliveries/my-active`.

---

## ✅ Resultado

Después de estos cambios:

- ✅ No más error 404 al navegar a "Entrega Activa"
- ✅ El pedido desaparece instantáneamente al aceptarlo
- ✅ Mejor experiencia de usuario (feedback inmediato)
- ✅ UI reactiva y fluida

---

**Corregido por:** GitHub Copilot  
**Fecha:** 31 de octubre de 2025
