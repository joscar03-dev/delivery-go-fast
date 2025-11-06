# Sistema de Pago y Checkout - Arquitectura Escalable

## 📊 Flujo del Proceso de Pago

### 1. **Carrito → Checkout**

```
Usuario en carrito → Click "Realizar Pedido" → Página de Checkout
```

### 2. **Página de Checkout (Nueva)**

#### Secciones:

1. **Resumen del Pedido**

   - Items del carrito
   - Subtotal de productos

2. **Dirección de Entrega**

   - Mostrar dirección seleccionada
   - Botón para cambiar (reutilizar componente `address-selector`)
   - Calcular delivery fee según restaurante

3. **Método de Pago**

   - Radio buttons: Efectivo, Yape, Tarjeta
   - Campos dinámicos según método seleccionado:
     - **Efectivo**: Input "¿Con cuánto pagas?" → Mostrar vuelto calculado
     - **Yape/Plin**: Input "Número de operación" + Upload de comprobante (opcional)
     - **Tarjeta**: Integración con pasarela (Niubiz, Culqi, Stripe)

4. **Resumen Final**

   - Subtotal: $XX.XX
   - Delivery: $X.XX
   - **Total: $XX.XX**

5. **Botón Confirmar Pedido**

---

## 🔄 Flujo Técnico Backend

### Endpoint: `POST /api/orders/checkout`

```typescript
// DTO de entrada
{
  restaurantId: string;
  items: CartItem[];
  deliveryAddressId: string;
  paymentMethodCode: 'cash' | 'yape' | 'card';

  // Condicional según método de pago
  cashAmount?: number; // Si es efectivo
  transactionReference?: string; // Si es Yape/Plin
  paymentProofUrl?: string; // Si es Yape/Plin

  notes?: string;
}
```

### Proceso Backend:

1. **Validar datos del pedido**

   - Verificar que todos los items existen
   - Verificar disponibilidad del restaurante
   - Verificar dirección del usuario

2. **Calcular costos**

   ```typescript
   const subtotal = calculateItemsTotal(items);
   const deliveryConfig = await getRestaurantDeliveryConfig(restaurantId);
   let deliveryFee = deliveryConfig.deliveryFee;

   // Aplicar delivery gratis si aplica
   if (
     deliveryConfig.freeDeliveryThreshold &&
     subtotal >= deliveryConfig.freeDeliveryThreshold
   ) {
     deliveryFee = 0;
   }

   const total = subtotal + deliveryFee;
   ```

3. **Validar método de pago**

   ```typescript
   if (paymentMethodCode === "cash") {
     if (!cashAmount || cashAmount < total) {
       throw new Error("El monto en efectivo debe ser mayor o igual al total");
     }
     changeAmount = cashAmount - total;
   }
   ```

4. **Crear pedido (transacción)**

   ```typescript
   await db.transaction(async (trx) => {
     // 1. Crear orden
     const order = await createOrder(
       {
         clientId,
         restaurantId,
         status: "pending",
         subtotal,
         deliveryFee,
         total,
         deliveryAddressId,
         items,
       },
       trx
     );

     // 2. Crear registro de pago
     await createOrderPayment(
       {
         orderId: order.id,
         paymentMethodCode,
         amount: total,
         deliveryFee,
         subtotal,
         cashAmount,
         changeAmount,
         transactionReference,
         paymentStatus: "pending",
       },
       trx
     );

     // 3. Si es efectivo, auto-verificar
     if (paymentMethodCode === "cash") {
       await updatePaymentStatus(order.id, "verified", trx);
     }

     return order;
   });
   ```

5. **Notificar**
   - Enviar notificación push al restaurante
   - Enviar notificación al cliente
   - Emitir evento WebSocket

---

## 🏗️ Estructura de Archivos Backend

### Nuevos Módulos:

```
api-server/src/
├── payments/
│   ├── payments.module.ts
│   ├── payments.controller.ts
│   ├── payments.service.ts
│   ├── entities/
│   │   ├── payment-method.entity.ts
│   │   ├── order-payment.entity.ts
│   │   └── restaurant-delivery-config.entity.ts
│   └── dto/
│       ├── create-payment.dto.ts
│       ├── verify-payment.dto.ts
│       └── checkout.dto.ts
└── restaurants/
    └── restaurant-delivery.service.ts (nuevo)
```

---

## 🎨 Estructura Frontend

### Nueva Página: Checkout

```
delivery-frontend/src/app/pages/
├── checkout/
│   ├── checkout.page.html
│   ├── checkout.page.ts
│   ├── checkout.page.scss
│   └── modelo.html (si tienes diseño de referencia)
```

### Componentes Reutilizables:

- `address-selector` (ya existe)
- Nuevo: `payment-method-selector`
- Nuevo: `order-summary-card`

---

## 📱 Flujo de Usuario (Frontend)

### Ruta de navegación:

```
/tabs/cart → /checkout → /order-confirmation → /tabs/order-history
```

### Estado del Checkout:

```typescript
interface CheckoutState {
  // Del carrito
  cartItems: CartItem[];
  restaurantId: string;
  restaurantName: string;

  // Delivery
  selectedAddress: Address | null;
  deliveryFee: number;

  // Pago
  selectedPaymentMethod: PaymentMethodCode;
  cashAmount?: number;
  changeAmount?: number;
  transactionReference?: string;

  // Totales
  subtotal: number;
  total: number;

  // UI
  loading: boolean;
  errors: string[];
}
```

---

## 🔐 Seguridad y Escalabilidad

### 1. **Validaciones**

- Backend valida SIEMPRE los precios (nunca confiar en frontend)
- Verificar que los items pertenecen al restaurante
- Validar stock disponible (si aplica)

### 2. **Concurrencia**

- Usar transacciones de base de datos
- Locks optimistas si es necesario
- Queue jobs para notificaciones (Bull, BullMQ)

### 3. **Caché**

```typescript
// Cachear configuración de delivery (Redis)
@Cacheable('restaurant-delivery', ttl: 3600)
async getRestaurantDeliveryConfig(restaurantId: string) {
  return this.deliveryConfigRepo.findOne({ restaurantId });
}
```

### 4. **Rate Limiting**

```typescript
// Limitar creación de pedidos
@UseGuards(ThrottlerGuard)
@Throttle(5, 60) // 5 pedidos por minuto
async checkout(@Body() dto: CheckoutDto) {
  // ...
}
```

### 5. **Auditoría**

- Logs de todas las transacciones
- Guardar snapshots de precios (por si cambian después)
- Tracking de cambios en pagos

---

## 📊 Métricas y Monitoreo

### KPIs a trackear:

- Tiempo promedio de checkout
- Tasa de abandono en checkout
- Métodos de pago más usados
- Delivery fee promedio
- Tasa de error en pagos

### Implementación:

```typescript
// Ejemplo con eventos
this.eventEmitter.emit("checkout.completed", {
  orderId,
  subtotal,
  deliveryFee,
  total,
  paymentMethod,
  completedIn: endTime - startTime,
});
```

---

## 🚀 Roadmap de Implementación

### Fase 1: MVP (1-2 semanas)

- [ ] Crear tablas de base de datos
- [ ] Crear entidades y servicios backend
- [ ] Endpoint de checkout básico
- [ ] Página de checkout frontend
- [ ] Solo método: Efectivo

### Fase 2: Pagos Digitales (1 semana)

- [ ] Agregar Yape/Plin
- [ ] Upload de comprobantes
- [ ] Panel de verificación para restaurantes

### Fase 3: Optimizaciones (1 semana)

- [ ] Caché de delivery configs
- [ ] Queue de notificaciones
- [ ] Validaciones avanzadas
- [ ] Tests unitarios e integración

### Fase 4: Tarjetas (2-3 semanas)

- [ ] Integración con pasarela
- [ ] PCI compliance
- [ ] Webhooks de confirmación
- [ ] Manejo de reembolsos

---

## 💡 Consideraciones Adicionales

### 1. **Propinas** (Futuro)

```typescript
ALTER TABLE order_payments ADD COLUMN tip_amount DECIMAL(10,2) DEFAULT 0.00;
```

### 2. **Cupones/Descuentos** (Futuro)

```typescript
CREATE TABLE order_discounts (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  coupon_code VARCHAR(50),
  discount_type VARCHAR(20), -- 'percentage', 'fixed'
  discount_value DECIMAL(10,2),
  discount_amount DECIMAL(10,2)
);
```

### 3. **Múltiples Tarifas de Delivery**

- Por distancia (tabla de rangos)
- Por horario (surge pricing)
- Por clima (lluvia = +$1)

### 4. **Wallet del Usuario**

```typescript
CREATE TABLE user_wallets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  balance DECIMAL(10,2) DEFAULT 0.00,
  currency VARCHAR(3) DEFAULT 'PEN'
);
```

---

## 🎯 Conclusión

Esta arquitectura es:

- ✅ **Escalable**: Soporta miles de pedidos concurrentes
- ✅ **Mantenible**: Código modular y bien estructurado
- ✅ **Segura**: Validaciones en backend, transacciones atómicas
- ✅ **Flexible**: Fácil agregar nuevos métodos de pago
- ✅ **Auditable**: Registro completo de todas las transacciones

### Próximos Pasos:

1. Revisar este documento con el equipo
2. Crear las migraciones de base de datos
3. Implementar el backend (módulo de pagos)
4. Crear la UI de checkout
5. Testing exhaustivo
6. Deploy incremental
