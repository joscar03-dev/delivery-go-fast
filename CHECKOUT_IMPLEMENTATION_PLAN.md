# Plan de Implementación del Sistema de Pago - Resumen Ejecutivo

## 🎯 Objetivo

Implementar un sistema de checkout y pago escalable que soporte efectivo, Yape/Plin y tarjetas, con cálculo de tarifa de delivery por restaurante.

---

## 📋 Cambios en Base de Datos

### Nuevas Tablas (3):

1. **`restaurant_delivery_config`** - Configuración de delivery por restaurante

   - delivery_fee (tarifa base)
   - free_delivery_threshold (delivery gratis si pedido > $X)
   - min_order_amount (pedido mínimo)
   - max_delivery_distance (km)
   - estimated_delivery_time (minutos)

2. **`payment_methods`** - Catálogo de métodos de pago

   - code ('cash', 'yape', 'plin', 'card')
   - name, description, is_active

3. **`order_payments`** - Información de pago de cada pedido
   - order_id (1:1 con orders)
   - payment_method_code
   - subtotal, delivery_fee, amount (total)
   - cash_amount, change_amount (para efectivo)
   - transaction_reference, payment_proof_url (para Yape/Plin)
   - payment_status ('pending', 'verified', 'failed')

### Modificaciones a Tablas Existentes:

**`orders`** - Agregar:

- subtotal (productos solamente)
- delivery_fee (tarifa de delivery)
- delivery_address_id (referencia a addresses)
- delivery_latitude, delivery_longitude (para tracking)

---

## 🔄 Flujo del Usuario

```
1. CARRITO
   ↓ Click "Realizar Pedido"

2. CHECKOUT PAGE (NUEVA)
   ├─ Ver items del pedido
   ├─ Confirmar/cambiar dirección de entrega
   ├─ Seleccionar método de pago:
   │  ├─ EFECTIVO → Input "¿Con cuánto pagas?" → Muestra vuelto
   │  ├─ YAPE/PLIN → Input "N° de operación" + Foto comprobante
   │  └─ TARJETA → Integración pasarela de pago
   ├─ Ver resumen:
   │  ├─ Subtotal: $XX.XX
   │  ├─ Delivery: $X.XX
   │  └─ TOTAL: $XX.XX
   ↓ Click "Confirmar Pedido"

3. CONFIRMACIÓN
   ↓

4. ORDER HISTORY
```

---

## 🏗️ Arquitectura Backend

### Nuevo Módulo: `payments/`

```typescript
PaymentsModule
├── PaymentsController
│   ├── GET /api/payment-methods (listar métodos disponibles)
│   ├── GET /api/restaurants/:id/delivery-config (obtener tarifa de delivery)
│   └── POST /api/payments/verify (verificar pago Yape/Plin - admin)
│
└── PaymentsService
    ├── getAvailablePaymentMethods()
    ├── getRestaurantDeliveryConfig(restaurantId)
    ├── calculateDeliveryFee(restaurantId, addressId)
    └── verifyPayment(orderId, status)
```

### Modificar Módulo: `orders/`

```typescript
OrdersService
└── checkout(dto: CheckoutDto)
    ├── 1. Validar items y precios
    ├── 2. Calcular subtotal
    ├── 3. Obtener delivery fee del restaurante
    ├── 4. Aplicar reglas (delivery gratis si aplica)
    ├── 5. Validar método de pago
    │   └─ Si es efectivo: validar cashAmount >= total
    ├── 6. Crear orden + payment en transacción
    └── 7. Notificar restaurante y cliente
```

---

## 📱 Frontend - Nueva Página

### `/checkout` (CheckoutPage)

**Estructura HTML:**

```html
<ion-content>
  <!-- Header sticky -->
  <header>Confirmar Pedido</header>

  <!-- 1. Resumen de items -->
  <section class="order-items">
    <h2>Tu pedido</h2>
    <div *ngFor="let item of cartItems" class="item-card">
      <!-- Mostrar item con cantidad y precio -->
    </div>
  </section>

  <!-- 2. Dirección de entrega -->
  <section class="delivery-address">
    <h2>Entregar en</h2>
    <div class="address-card">
      <p>{{ selectedAddress.street }}</p>
      <button (click)="changeAddress()">Cambiar</button>
    </div>
  </section>

  <!-- 3. Método de pago -->
  <section class="payment-method">
    <h2>Método de pago</h2>

    <div class="payment-options">
      <!-- Radio buttons -->
      <label>
        <input type="radio" value="cash" [(ngModel)]="selectedPaymentMethod" />
        <span>Efectivo</span>
      </label>

      <label>
        <input type="radio" value="yape" [(ngModel)]="selectedPaymentMethod" />
        <span>Yape</span>
      </label>

      <label>
        <input type="radio" value="card" [(ngModel)]="selectedPaymentMethod" />
        <span>Tarjeta</span>
      </label>
    </div>

    <!-- Campos dinámicos según método -->
    <div *ngIf="selectedPaymentMethod === 'cash'" class="cash-fields">
      <label>
        ¿Con cuánto pagas?
        <input
          type="number"
          [(ngModel)]="cashAmount"
          (ngModelChange)="calculateChange()"
        />
      </label>
      <p *ngIf="changeAmount > 0" class="change-info">
        Su vuelto: ${{ changeAmount | number:'1.2-2' }}
      </p>
    </div>

    <div *ngIf="selectedPaymentMethod === 'yape'" class="yape-fields">
      <label>
        Número de operación
        <input type="text" [(ngModel)]="transactionReference" />
      </label>
      <label>
        Comprobante (opcional)
        <input type="file" (change)="onFileSelected($event)" />
      </label>
    </div>
  </section>

  <!-- 4. Resumen de costos -->
  <section class="cost-summary">
    <div class="line">
      <span>Subtotal</span>
      <span>${{ subtotal | number:'1.2-2' }}</span>
    </div>
    <div class="line">
      <span>Delivery</span>
      <span>${{ deliveryFee | number:'1.2-2' }}</span>
    </div>
    <div class="line total">
      <span>Total</span>
      <span>${{ total | number:'1.2-2' }}</span>
    </div>
  </section>

  <!-- 5. Footer fijo con botón -->
  <footer>
    <button (click)="confirmOrder()" [disabled]="!canConfirm()">
      Confirmar Pedido
    </button>
  </footer>
</ion-content>
```

**TypeScript:**

```typescript
export class CheckoutPage implements OnInit {
  cartItems: CartItem[] = [];
  selectedAddress: Address | null = null;

  selectedPaymentMethod: PaymentMethodCode = PaymentMethodCode.CASH;
  cashAmount: number = 0;
  changeAmount: number = 0;
  transactionReference: string = "";

  subtotal: number = 0;
  deliveryFee: number = 0;
  total: number = 0;

  async ngOnInit() {
    await this.loadCheckoutData();
  }

  async loadCheckoutData() {
    // 1. Obtener items del carrito
    this.cartItems = this.cartService.cartItems;

    // 2. Calcular subtotal
    this.subtotal = this.cartService.totalPrice;

    // 3. Obtener delivery fee del restaurante
    const restaurantId = this.cartService.currentRestaurantId;
    const deliveryConfig =
      await this.paymentService.getRestaurantDeliveryConfig(restaurantId);

    this.deliveryFee = deliveryConfig.deliveryFee;

    // Aplicar delivery gratis si aplica
    if (
      deliveryConfig.freeDeliveryThreshold &&
      this.subtotal >= deliveryConfig.freeDeliveryThreshold
    ) {
      this.deliveryFee = 0;
    }

    // 4. Calcular total
    this.total = this.subtotal + this.deliveryFee;

    // 5. Obtener dirección seleccionada
    this.selectedAddress = await this.addressService.getDefaultAddress();
  }

  calculateChange() {
    if (this.cashAmount >= this.total) {
      this.changeAmount = this.cashAmount - this.total;
    } else {
      this.changeAmount = 0;
    }
  }

  canConfirm(): boolean {
    if (!this.selectedAddress) return false;

    if (this.selectedPaymentMethod === PaymentMethodCode.CASH) {
      return this.cashAmount >= this.total;
    }

    if (this.selectedPaymentMethod === PaymentMethodCode.YAPE) {
      return !!this.transactionReference;
    }

    return true;
  }

  async confirmOrder() {
    try {
      const checkoutDto: CheckoutDto = {
        restaurantId: this.cartService.currentRestaurantId!,
        items: this.cartItems,
        deliveryAddressId: this.selectedAddress!.id,
        paymentMethodCode: this.selectedPaymentMethod,
        cashAmount: this.cashAmount || undefined,
        transactionReference: this.transactionReference || undefined,
      };

      const order = await this.orderService.checkout(checkoutDto);

      // Limpiar carrito
      this.cartService.clearCart();

      // Ir a confirmación
      this.router.navigate(["/order-confirmation", order.id]);
    } catch (error) {
      // Manejar error
    }
  }
}
```

---

## ⚙️ Backend DTO

```typescript
// checkout.dto.ts
export class CheckoutDto {
  @IsUUID()
  restaurantId: string;

  @IsArray()
  @ValidateNested({ each: true })
  items: CreateOrderItemDto[];

  @IsUUID()
  deliveryAddressId: string;

  @IsEnum(PaymentMethodCode)
  paymentMethodCode: PaymentMethodCode;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cashAmount?: number;

  @IsOptional()
  @IsString()
  transactionReference?: string;

  @IsOptional()
  @IsString()
  paymentProofUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
```

---

## 🚀 Pasos de Implementación (Orden Recomendado)

### Semana 1: Base de Datos y Backend Base

1. ✅ Ejecutar migración SQL (crear tablas)
2. ✅ Crear entidades TypeORM (payment-method, order-payment, restaurant-delivery-config)
3. ✅ Crear módulo de pagos (PaymentsModule)
4. ✅ Crear servicios básicos
5. ✅ Modificar OrdersService para agregar método `checkout()`

### Semana 2: Backend Completo

6. ✅ Implementar lógica de cálculo de delivery fee
7. ✅ Implementar validaciones de pago
8. ✅ Implementar transacciones para crear orden + pago
9. ✅ Agregar endpoints REST
10. ✅ Tests unitarios

### Semana 3: Frontend

11. ✅ Crear modelos TypeScript (payment.model.ts)
12. ✅ Crear servicio PaymentService
13. ✅ Crear página CheckoutPage
14. ✅ Implementar UI según modelo de diseño
15. ✅ Conectar con backend

### Semana 4: Testing y Refinamiento

16. ✅ Testing E2E del flujo completo
17. ✅ Optimizaciones de rendimiento
18. ✅ Manejo de errores
19. ✅ Notificaciones push
20. ✅ Deploy a producción

---

## 📊 Consideraciones de Escalabilidad

### 1. **Caché** (Redis)

- Configuración de delivery por restaurante (TTL: 1 hora)
- Métodos de pago disponibles (TTL: 24 horas)

### 2. **Queue Jobs** (Bull/BullMQ)

- Procesamiento asíncrono de pagos Yape/Plin
- Notificaciones push (evitar bloquear el checkout)

### 3. **Rate Limiting**

- Máximo 5 checkouts por minuto por usuario
- Protección contra spam y bots

### 4. **Database Optimization**

- Índices en order_payments.order_id
- Índices en restaurant_delivery_config.restaurant_id
- Particionamiento de orders por fecha (futuro)

### 5. **Monitoring**

- Tiempo de respuesta de checkout
- Tasa de éxito/fallo de pagos
- Alertas si delivery fee no está configurado

---

## 💰 Costo de Delivery - Lógica Avanzada (Futuro)

### Opción 1: Tarifa Fija

```typescript
deliveryFee = 5.0;
```

### Opción 2: Por Distancia

```typescript
if (distance <= 2km) deliveryFee = 3.00
else if (distance <= 5km) deliveryFee = 5.00
else if (distance <= 10km) deliveryFee = 8.00
else deliveryFee = 12.00
```

### Opción 3: Por Monto del Pedido

```typescript
if (subtotal >= 50) deliveryFee = 0.0; // Delivery gratis
else if (subtotal >= 30) deliveryFee = 2.0;
else deliveryFee = 5.0;
```

### Opción 4: Horario Pico (Surge Pricing)

```typescript
if (isPeakHour()) {
  deliveryFee = baseDeliveryFee * 1.5;
}
```

---

## 🎯 Resultado Final

Al finalizar tendrás:

- ✅ Sistema de checkout completo y funcional
- ✅ Soporte para 3 métodos de pago (Efectivo, Yape/Plin, Tarjeta)
- ✅ Cálculo automático de delivery fee por restaurante
- ✅ Delivery gratis cuando el pedido supera X monto
- ✅ Validación de vuelto para pagos en efectivo
- ✅ Registro completo de todas las transacciones
- ✅ Sistema escalable para miles de usuarios concurrentes
- ✅ Auditable y seguro

---

## 📞 Soporte y Consultas

Si tienes dudas sobre algún paso específico, puedo ayudarte con:

1. Código específico de alguna parte
2. Explicación más detallada de algún componente
3. Alternativas de implementación
4. Mejores prácticas de seguridad
5. Optimizaciones adicionales
