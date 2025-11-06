# 💡 Ejemplos Prácticos de Implementación

## 1. Implementar Cart Facade (Ejemplo Completo)

### Paso 1: Crear la Store

```typescript
// src/app/core/state/cart/cart.store.ts
import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { map, distinctUntilChanged } from "rxjs/operators";
import { CartItem } from "../../models/entities/cart.entity";

export interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  loading: boolean;
  error: string | null;
}

const INITIAL_STATE: CartState = {
  items: [],
  restaurantId: null,
  loading: false,
  error: null,
};

@Injectable({ providedIn: "root" })
export class CartStore {
  private readonly _state = new BehaviorSubject<CartState>(INITIAL_STATE);

  // Exponer estado completo
  readonly state$ = this._state.asObservable();

  // Selectores específicos
  readonly items$ = this.select((state) => state.items);
  readonly restaurantId$ = this.select((state) => state.restaurantId);
  readonly loading$ = this.select((state) => state.loading);
  readonly error$ = this.select((state) => state.error);

  // Getter para acceso sincrónico
  get snapshot(): CartState {
    return this._state.value;
  }

  // Selector genérico con memoización
  private select<T>(selector: (state: CartState) => T): Observable<T> {
    return this.state$.pipe(map(selector), distinctUntilChanged());
  }

  // Actualizar estado (inmutable)
  setState(partialState: Partial<CartState>): void {
    const currentState = this._state.value;
    const newState = { ...currentState, ...partialState };
    this._state.next(newState);
  }

  // Reset completo
  reset(): void {
    this._state.next(INITIAL_STATE);
  }
}
```

### Paso 2: Crear la Facade

```typescript
// src/app/core/state/cart/cart.facade.ts
import { Injectable, computed, signal } from "@angular/core";
import { Observable, combineLatest } from "rxjs";
import { map } from "rxjs/operators";
import { CartStore } from "./cart.store";
import { CartItem } from "../../models/entities/cart.entity";
import { StorageHelper } from "../../../shared/utils/helpers/storage.helper";

const CART_STORAGE_KEY = "cart";

@Injectable({ providedIn: "root" })
export class CartFacade {
  // Streams públicos
  readonly items$ = this.store.items$;
  readonly loading$ = this.store.loading$;
  readonly error$ = this.store.error$;
  readonly restaurantId$ = this.store.restaurantId$;

  // Computed values
  readonly itemCount$ = this.items$.pipe(map((items) => items.reduce((sum, item) => sum + item.quantity, 0)));

  readonly totalPrice$ = this.items$.pipe(map((items) => this.calculateTotalPrice(items)));

  readonly isEmpty$ = this.items$.pipe(map((items) => items.length === 0));

  // View model combinado
  readonly cartViewModel$ = combineLatest([this.items$, this.itemCount$, this.totalPrice$, this.isEmpty$, this.loading$]).pipe(
    map(([items, count, total, isEmpty, loading]) => ({
      items,
      itemCount: count,
      totalPrice: total,
      isEmpty,
      loading,
      formattedTotal: this.formatCurrency(total),
    }))
  );

  constructor(private readonly store: CartStore) {
    this.loadFromStorage();
  }

  // ========== Comandos (Actions) ==========

  addItem(item: CartItem): void {
    const currentItems = this.store.snapshot.items;

    // Verificar si el ítem ya existe
    const existingIndex = currentItems.findIndex((i) => i.menuItemId === item.menuItemId && this.areOptionsEqual(i.options, item.options));

    let updatedItems: CartItem[];

    if (existingIndex >= 0) {
      // Incrementar cantidad
      updatedItems = currentItems.map((i, idx) => (idx === existingIndex ? { ...i, quantity: i.quantity + item.quantity } : i));
    } else {
      // Agregar nuevo
      updatedItems = [...currentItems, item];
    }

    this.store.setState({
      items: updatedItems,
      restaurantId: item.restaurantId,
    });

    this.saveToStorage();
  }

  updateQuantity(menuItemId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(menuItemId);
      return;
    }

    const updatedItems = this.store.snapshot.items.map((item) => (item.menuItemId === menuItemId ? { ...item, quantity } : item));

    this.store.setState({ items: updatedItems });
    this.saveToStorage();
  }

  removeItem(menuItemId: string): void {
    const updatedItems = this.store.snapshot.items.filter((item) => item.menuItemId !== menuItemId);

    this.store.setState({
      items: updatedItems,
      restaurantId: updatedItems.length > 0 ? this.store.snapshot.restaurantId : null,
    });

    this.saveToStorage();
  }

  clear(): void {
    this.store.reset();
    this.clearStorage();
  }

  // ========== Queries (Selectors) ==========

  getItemByMenuId(menuItemId: string): CartItem | undefined {
    return this.store.snapshot.items.find((item) => item.menuItemId === menuItemId);
  }

  canAddFromRestaurant(restaurantId: string): boolean {
    const currentRestaurantId = this.store.snapshot.restaurantId;
    return !currentRestaurantId || currentRestaurantId === restaurantId;
  }

  // ========== Helpers privados ==========

  private calculateTotalPrice(items: CartItem[]): number {
    return items.reduce((total, item) => {
      const itemTotal = item.price + this.calculateExtras(item);
      return total + itemTotal * item.quantity;
    }, 0);
  }

  private calculateExtras(item: CartItem): number {
    // Lógica de cálculo de extras
    return 0;
  }

  private areOptionsEqual(opt1: any, opt2: any): boolean {
    return JSON.stringify(opt1) === JSON.stringify(opt2);
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat("es-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }

  private loadFromStorage(): void {
    const savedState = StorageHelper.get<CartState>(CART_STORAGE_KEY);
    if (savedState) {
      this.store.setState(savedState);
    }
  }

  private saveToStorage(): void {
    StorageHelper.set(CART_STORAGE_KEY, this.store.snapshot);
  }

  private clearStorage(): void {
    StorageHelper.remove(CART_STORAGE_KEY);
  }
}
```

### Paso 3: Usar en Componente

```typescript
// pages/cart/cart.page.ts
import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CartFacade } from "../../core/state/cart/cart.facade";

@Component({
  selector: "app-cart",
  standalone: true,
  imports: [CommonModule /* ... */],
  template: `
    <ng-container *ngIf="vm$ | async as vm">
      <div *ngIf="vm.loading" class="loading">
        <ion-spinner></ion-spinner>
      </div>

      <div *ngIf="!vm.loading && !vm.isEmpty">
        <h2>Total: {{ vm.formattedTotal }}</h2>
        <p>{{ vm.itemCount }} productos</p>

        <app-cart-item-list [items]="vm.items" (quantityChanged)="onQuantityChange($event)" (itemRemoved)="onItemRemove($event)"></app-cart-item-list>

        <ion-button (click)="checkout()"> Realizar Pedido </ion-button>
      </div>

      <div *ngIf="vm.isEmpty" class="empty">
        <p>Tu carrito está vacío</p>
      </div>
    </ng-container>
  `,
})
export class CartPage {
  vm$ = this.cartFacade.cartViewModel$;

  constructor(private readonly cartFacade: CartFacade) {}

  onQuantityChange(event: { menuItemId: string; quantity: number }): void {
    this.cartFacade.updateQuantity(event.menuItemId, event.quantity);
  }

  onItemRemove(menuItemId: string): void {
    this.cartFacade.removeItem(menuItemId);
  }

  checkout(): void {
    // Lógica de checkout
  }
}
```

---

## 2. Feature Module: Orders

### Estructura

```
src/app/features/orders/
├── index.ts                        # Barrel export
├── orders.routes.ts                # Rutas del módulo
├── components/
│   ├── order-card/
│   │   ├── order-card.component.ts
│   │   └── order-card.component.html
│   └── order-status-badge/
├── pages/
│   ├── order-history/
│   │   ├── order-history.page.ts
│   │   └── order-history.page.html
│   └── order-detail/
├── models/
│   ├── order.entity.ts
│   └── order.vm.ts
└── state/
    ├── orders.store.ts
    └── orders.facade.ts
```

### Implementación

```typescript
// features/orders/index.ts (Barrel Export)
export * from "./pages/order-history/order-history.page";
export * from "./pages/order-detail/order-detail.page";
export * from "./state/orders.facade";
export * from "./models/order.entity";

// features/orders/orders.routes.ts
import { Routes } from "@angular/router";
import { authGuard } from "../../core/guards/auth.guard";

export const ordersRoutes: Routes = [
  {
    path: "order-history",
    canMatch: [authGuard],
    loadComponent: () => import("./pages/order-history/order-history.page").then((m) => m.OrderHistoryPage),
  },
  {
    path: "order-detail/:id",
    canMatch: [authGuard],
    loadComponent: () => import("./pages/order-detail/order-detail.page").then((m) => m.OrderDetailPage),
  },
];

// En tabs.routes.ts
import { ordersRoutes } from "../features/orders/orders.routes";

export const routes: Routes = [
  {
    path: "",
    component: TabsPage,
    children: [
      ...ordersRoutes, // ← Importar rutas del feature
      // otras rutas...
    ],
  },
];
```

---

## 3. Shared Components con ChangeDetection.OnPush

```typescript
// shared/components/order-card/order-card.component.ts
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { IonCard, IonCardHeader } from "@ionic/angular/standalone";
import { OrderViewModel } from "../../../core/models/view-models/order.vm";
import { OrderStatusPipe } from "../../pipes/order-status.pipe";

@Component({
  selector: "app-order-card",
  standalone: true,
  imports: [CommonModule, IonCard, IonCardHeader, OrderStatusPipe],
  changeDetection: ChangeDetectionStrategy.OnPush, // ⚡ Performance
  template: `
    <ion-card (click)="cardClicked.emit(order.id)">
      <ion-card-header>
        <div class="order-header">
          <h3>Pedido #{{ order.id }}</h3>
          <ion-badge [color]="(order.status | orderStatus).color">
            {{ (order.status | orderStatus).label }}
          </ion-badge>
        </div>
      </ion-card-header>

      <ion-card-content>
        <p>{{ order.formattedDate }}</p>
        <p class="total">{{ order.formattedTotal }}</p>
      </ion-card-content>
    </ion-card>
  `,
  styles: [
    `
      .order-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .total {
        font-weight: bold;
        font-size: 1.2rem;
      }
    `,
  ],
})
export class OrderCardComponent {
  @Input({ required: true }) order!: OrderViewModel;
  @Output() cardClicked = new EventEmitter<string>();
}
```

---

## 4. Path Aliases en tsconfig.json

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@core/*": ["app/core/*"],
      "@shared/*": ["app/shared/*"],
      "@features/*": ["app/features/*"],
      "@env/*": ["environments/*"]
    }
  }
}
```

**Uso:**

```typescript
// ❌ Antes
import { CartFacade } from "../../../core/state/cart/cart.facade";

// ✅ Después
import { CartFacade } from "@core/state/cart/cart.facade";
```

---

## 5. Storage Helper

```typescript
// shared/utils/helpers/storage.helper.ts
export class StorageHelper {
  static get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from storage: ${key}`, error);
      return null;
    }
  }

  static set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to storage: ${key}`, error);
    }
  }

  static remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from storage: ${key}`, error);
    }
  }

  static clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error("Error clearing storage", error);
    }
  }
}
```

---

## 6. Custom Validators

```typescript
// shared/utils/validators/custom-validators.ts
import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export class CustomValidators {
  static phone(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      const phoneRegex = /^[\d\s\-\(\)\+]+$/;
      return phoneRegex.test(value) ? null : { invalidPhone: true };
    };
  }

  static minAmount(min: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = parseFloat(control.value);
      return value >= min ? null : { minAmount: { min, actual: value } };
    };
  }

  static addressRequired(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const address = control.value;
      if (!address) return { required: true };

      const hasStreet = address.street?.trim().length > 0;
      const hasCity = address.city?.trim().length > 0;

      return hasStreet && hasCity ? null : { addressIncomplete: true };
    };
  }
}
```

---

## 7. Testing Facade

```typescript
// core/state/cart/cart.facade.spec.ts
import { TestBed } from "@angular/core/testing";
import { CartFacade } from "./cart.facade";
import { CartStore } from "./cart.store";
import { CartItem } from "../../models/entities/cart.entity";

describe("CartFacade", () => {
  let facade: CartFacade;
  let store: CartStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CartFacade, CartStore],
    });

    facade = TestBed.inject(CartFacade);
    store = TestBed.inject(CartStore);
  });

  it("should add item to cart", (done) => {
    const item: CartItem = {
      menuItemId: "1",
      name: "Pizza",
      price: 10,
      quantity: 1,
      restaurantId: "rest1",
    };

    facade.addItem(item);

    facade.items$.subscribe((items) => {
      expect(items.length).toBe(1);
      expect(items[0]).toEqual(item);
      done();
    });
  });

  it("should calculate total price correctly", (done) => {
    const items: CartItem[] = [
      { menuItemId: "1", price: 10, quantity: 2, restaurantId: "rest1" },
      { menuItemId: "2", price: 15, quantity: 1, restaurantId: "rest1" },
    ];

    items.forEach((item) => facade.addItem(item));

    facade.totalPrice$.subscribe((total) => {
      expect(total).toBe(35); // (10*2) + (15*1)
      done();
    });
  });

  it("should remove item from cart", (done) => {
    const item: CartItem = {
      menuItemId: "1",
      price: 10,
      quantity: 1,
      restaurantId: "rest1",
    };

    facade.addItem(item);
    facade.removeItem("1");

    facade.items$.subscribe((items) => {
      expect(items.length).toBe(0);
      done();
    });
  });
});
```

---

## 🚀 Orden de Implementación Recomendado

1. **Week 1:** Implementar `CartFacade` y migrar `CartService`
2. **Week 2:** Crear estructura de `features/orders`
3. **Week 3:** Implementar shared components y pipes
4. **Week 4:** Agregar path aliases y refactorizar imports
5. **Week 5:** Implementar testing para facades
6. **Week 6:** Documentar y crear guías de estilo

---

## 📚 Comandos Útiles

```bash
# Generar feature module
ng generate module features/orders --routing

# Generar componente presentacional
ng generate component features/orders/components/order-card --standalone --change-detection OnPush

# Generar servicio
ng generate service core/state/cart/cart-facade

# Generar pipe
ng generate pipe shared/pipes/order-status --standalone

# Run tests
ng test --code-coverage
```

---

## ✅ Checklist de Migración

- [ ] Crear estructura de carpetas core/shared/features
- [ ] Implementar CartStore y CartFacade
- [ ] Migrar CartService a usar CartFacade
- [ ] Actualizar CartPage para usar vm$
- [ ] Crear OrdersFacade
- [ ] Migrar OrderService
- [ ] Implementar path aliases
- [ ] Crear shared components
- [ ] Agregar pipes y validators
- [ ] Escribir tests unitarios
- [ ] Documentar patrones
