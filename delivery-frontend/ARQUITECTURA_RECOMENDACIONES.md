# 🏗️ Análisis y Recomendaciones de Arquitectura Frontend

## 📊 Estado Actual de la Arquitectura

### ✅ **Puntos Fuertes Actuales**

1. **Standalone Components** - Excelente decisión para Angular 20
2. **Lazy Loading** - Todas las páginas se cargan bajo demanda
3. **Separación clara de responsabilidades**:

   - `services/` - Lógica de negocio
   - `guards/` - Control de acceso
   - `interceptors/` - Manejo de HTTP
   - `models/` - Tipos e interfaces
   - `pages/` - Componentes de página
   - `components/` - Componentes reutilizables

4. **Guards funcionales** - Usando la nueva API de Angular
5. **RxJS** - Manejo reactivo de estado

---

## 🎯 Áreas de Mejora y Patrones Recomendados

### 1️⃣ **ESTADO: Implementar State Management**

#### ❌ Problema Actual

```typescript
// cart.service.ts - Mezcla estado con lógica
private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
public cartItems$ = this.cartItemsSubject.asObservable();
```

#### ✅ Solución: Patrón **Façade + State**

```
src/app/
├── core/
│   ├── state/
│   │   ├── cart/
│   │   │   ├── cart.store.ts          // Estado puro
│   │   │   ├── cart.actions.ts        // Acciones
│   │   │   └── cart.facade.ts         // Fachada
│   │   ├── orders/
│   │   └── user/
│   └── services/                       // Solo API calls
│       ├── api/
│       │   ├── cart-api.service.ts
│       │   ├── order-api.service.ts
│       │   └── restaurant-api.service.ts
```

**Beneficios:**

- Separación clara entre estado y API
- Testeable
- Escalable
- Single source of truth

---

### 2️⃣ **ORGANIZACIÓN: Feature Modules**

#### ❌ Estructura Actual

```
src/app/
├── pages/
│   ├── cart/
│   ├── order-history/
│   ├── restaurant-detail/
│   └── ...
```

#### ✅ Estructura Recomendada: **Feature-Based**

```
src/app/
├── core/                               // Singleton services
│   ├── state/
│   ├── services/
│   ├── guards/
│   ├── interceptors/
│   └── models/
├── shared/                             // Shared across features
│   ├── components/
│   │   ├── wave-background/
│   │   └── ui/
│   ├── directives/
│   ├── pipes/
│   └── utils/
├── features/                           // Feature modules
│   ├── restaurants/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── restaurant-list/
│   │   │   ├── restaurant-detail/
│   │   │   └── menu-item-detail/
│   │   ├── models/
│   │   ├── services/
│   │   └── restaurants.routes.ts
│   ├── orders/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── cart/
│   │   │   ├── order-history/
│   │   │   └── order-detail/
│   │   ├── models/
│   │   └── orders.routes.ts
│   ├── delivery/
│   ├── profile/
│   └── admin/
└── layout/                             // App shell
    └── tabs/
```

**Beneficios:**

- Cada feature es independiente
- Fácil de escalar
- Mejor organización del código
- Reusabilidad dentro de cada feature

---

### 3️⃣ **MODELOS: Data Transfer Objects (DTOs)**

#### ❌ Problema Actual

```typescript
// Mezcla entre request, response y entidades del cliente
export interface Order {
  id: string;
  client?: User;
  status: OrderStatus;
  // ...
}
```

#### ✅ Solución: Separar DTOs, Entities y ViewModels

```
src/app/core/models/
├── dtos/                               // API contracts
│   ├── order.dto.ts
│   ├── restaurant.dto.ts
│   └── cart.dto.ts
├── entities/                           // Domain models
│   ├── order.entity.ts
│   ├── restaurant.entity.ts
│   └── cart.entity.ts
└── view-models/                        // UI models
    ├── order.vm.ts
    └── restaurant-card.vm.ts
```

**Ejemplo:**

```typescript
// dtos/order.dto.ts
export interface CreateOrderRequestDto {
  restaurantId: string;
  items: OrderItemDto[];
  deliveryAddress: string;
}

export interface OrderResponseDto {
  id: string;
  clientId: string;
  status: string;
  total: number;
  // API response format
}

// entities/order.entity.ts
export class OrderEntity {
  constructor(public id: string, public status: OrderStatus, public total: number, public items: OrderItemEntity[]) {}

  static fromDto(dto: OrderResponseDto): OrderEntity {
    // Transformation logic
  }
}

// view-models/order.vm.ts
export interface OrderViewModel {
  id: string;
  statusLabel: string;
  statusColor: string;
  formattedTotal: string;
  formattedDate: string;
  // Optimized for UI
}
```

---

### 4️⃣ **SERVICIOS: Repository Pattern**

#### ❌ Problema Actual

```typescript
// order.service.ts - Mezcla API calls con lógica
export class OrderService {
  createOrder(data: CreateOrderDto): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/orders`, data);
  }

  // También tiene lógica de transformación, caché, etc.
}
```

#### ✅ Solución: Repository + API Service

```typescript
// core/services/api/order-api.service.ts
@Injectable({ providedIn: "root" })
export class OrderApiService {
  private readonly apiUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  create(dto: CreateOrderRequestDto): Observable<OrderResponseDto> {
    return this.http.post<OrderResponseDto>(this.apiUrl, dto);
  }

  getById(id: string): Observable<OrderResponseDto> {
    return this.http.get<OrderResponseDto>(`${this.apiUrl}/${id}`);
  }
}

// core/repositories/order.repository.ts
@Injectable({ providedIn: "root" })
export class OrderRepository {
  constructor(private api: OrderApiService) {}

  create(entity: OrderEntity): Observable<OrderEntity> {
    const dto = entity.toDto();
    return this.api.create(dto).pipe(map((response) => OrderEntity.fromDto(response)));
  }

  findById(id: string): Observable<OrderEntity> {
    return this.api.getById(id).pipe(map((dto) => OrderEntity.fromDto(dto)));
  }
}
```

---

### 5️⃣ **ESTADO: Reactive State Store**

#### ✅ Implementación sin librerías externas

```typescript
// core/state/cart/cart.store.ts
import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

export interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: CartState = {
  items: [],
  restaurantId: null,
  loading: false,
  error: null,
};

@Injectable({ providedIn: "root" })
export class CartStore {
  private state = new BehaviorSubject<CartState>(initialState);

  readonly state$ = this.state.asObservable();
  readonly items$ = this.select((state) => state.items);
  readonly loading$ = this.select((state) => state.loading);

  private select<T>(selector: (state: CartState) => T): Observable<T> {
    return this.state$.pipe(map(selector), distinctUntilChanged());
  }

  setState(partialState: Partial<CartState>): void {
    this.state.next({ ...this.state.value, ...partialState });
  }

  resetState(): void {
    this.state.next(initialState);
  }
}

// core/state/cart/cart.facade.ts
@Injectable({ providedIn: "root" })
export class CartFacade {
  readonly items$ = this.store.items$;
  readonly loading$ = this.store.loading$;
  readonly itemCount$ = this.items$.pipe(map((items) => items.reduce((sum, item) => sum + item.quantity, 0)));

  constructor(private store: CartStore, private repository: CartRepository) {}

  addItem(item: CartItem): void {
    const currentItems = this.store.state.value.items;
    this.store.setState({
      items: [...currentItems, item],
    });
    this.saveToStorage();
  }

  removeItem(itemId: string): void {
    const items = this.store.state.value.items.filter((i) => i.id !== itemId);
    this.store.setState({ items });
    this.saveToStorage();
  }

  clear(): void {
    this.store.resetState();
    this.clearStorage();
  }

  private saveToStorage(): void {
    localStorage.setItem("cart", JSON.stringify(this.store.state.value));
  }
}
```

---

### 6️⃣ **COMPONENTES: Smart vs Presentational**

#### ✅ Patrón Container/Presenter

```typescript
// features/orders/pages/order-history/order-history.page.ts (SMART)
@Component({
  selector: "app-order-history",
  template: ` <app-order-list [orders]="orders$ | async" [loading]="loading$ | async" (orderSelected)="onOrderSelected($event)"></app-order-list> `,
})
export class OrderHistoryPage {
  orders$ = this.ordersFacade.orders$;
  loading$ = this.ordersFacade.loading$;

  constructor(private ordersFacade: OrdersFacade, private router: Router) {}

  onOrderSelected(orderId: string): void {
    this.router.navigate(["/tabs/order-detail", orderId]);
  }
}

// features/orders/components/order-list/order-list.component.ts (PRESENTATIONAL)
@Component({
  selector: "app-order-list",
  template: `
    <ion-list *ngIf="!loading; else loadingTemplate">
      <app-order-card *ngFor="let order of orders" [order]="order" (click)="orderSelected.emit(order.id)"></app-order-card>
    </ion-list>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush, // ⚡ Performance
})
export class OrderListComponent {
  @Input() orders: Order[] = [];
  @Input() loading = false;
  @Output() orderSelected = new EventEmitter<string>();
}
```

---

### 7️⃣ **UTILIDADES: Shared Utilities**

```
src/app/shared/
├── utils/
│   ├── formatters/
│   │   ├── currency.formatter.ts
│   │   ├── date.formatter.ts
│   │   └── status.formatter.ts
│   ├── validators/
│   │   ├── custom-validators.ts
│   │   └── address.validator.ts
│   └── helpers/
│       ├── storage.helper.ts
│       └── error.helper.ts
├── pipes/
│   ├── currency-custom.pipe.ts
│   ├── time-ago.pipe.ts
│   └── order-status.pipe.ts
└── directives/
    ├── auto-focus.directive.ts
    └── lazy-load-image.directive.ts
```

**Ejemplo:**

```typescript
// shared/utils/formatters/currency.formatter.ts
export class CurrencyFormatter {
  static format(amount: number, currency = "USD"): string {
    return new Intl.NumberFormat("es-US", {
      style: "currency",
      currency,
    }).format(amount);
  }
}

// shared/pipes/order-status.pipe.ts
@Pipe({ name: "orderStatus", standalone: true })
export class OrderStatusPipe implements PipeTransform {
  transform(status: OrderStatus): { label: string; color: string } {
    const statusMap = {
      [OrderStatus.PENDING]: { label: "Pendiente", color: "warning" },
      [OrderStatus.CONFIRMED]: { label: "Confirmado", color: "primary" },
      // ...
    };
    return statusMap[status] || { label: status, color: "medium" };
  }
}
```

---

### 8️⃣ **CONFIGURACIÓN: Environment por Feature**

```
src/
├── environments/
│   ├── environment.ts
│   ├── environment.prod.ts
│   └── environment.staging.ts
└── app/
    └── core/
        └── config/
            ├── api.config.ts
            ├── firebase.config.ts
            └── app.config.ts
```

```typescript
// core/config/api.config.ts
import { environment } from "../../../environments/environment";

export const ApiConfig = {
  baseUrl: environment.apiUrl,
  endpoints: {
    orders: "/orders",
    restaurants: "/restaurants",
    auth: "/auth",
  },
  timeout: 30000,
  retries: 3,
} as const;
```

---

### 9️⃣ **TESTING: Estructura de Tests**

```
src/app/features/orders/
├── pages/
│   └── order-history/
│       ├── order-history.page.ts
│       ├── order-history.page.spec.ts      // Unit test
│       └── order-history.page.e2e.spec.ts  // E2E test
└── services/
    └── order.facade.spec.ts
```

```typescript
// order.facade.spec.ts
describe("OrderFacade", () => {
  let facade: OrderFacade;
  let store: CartStore;
  let repository: jasmine.SpyObj<OrderRepository>;

  beforeEach(() => {
    const repositorySpy = jasmine.createSpyObj("OrderRepository", ["create"]);

    TestBed.configureTestingModule({
      providers: [OrderFacade, CartStore, { provide: OrderRepository, useValue: repositorySpy }],
    });

    facade = TestBed.inject(OrderFacade);
    store = TestBed.inject(CartStore);
    repository = TestBed.inject(OrderRepository) as jasmine.SpyObj<OrderRepository>;
  });

  it("should create order successfully", (done) => {
    const mockOrder = { id: "1", total: 100 };
    repository.create.and.returnValue(of(mockOrder));

    facade.createOrder().subscribe((order) => {
      expect(order).toEqual(mockOrder);
      done();
    });
  });
});
```

---

### 🔟 **ERROR HANDLING: Global Error Handler**

```typescript
// core/handlers/global-error.handler.ts
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private injector: Injector, private logger: LoggerService) {}

  handleError(error: Error | HttpErrorResponse): void {
    const toastCtrl = this.injector.get(ToastController);

    if (error instanceof HttpErrorResponse) {
      // Server error
      this.handleServerError(error, toastCtrl);
    } else {
      // Client error
      this.handleClientError(error, toastCtrl);
    }

    this.logger.logError(error);
  }

  private handleServerError(error: HttpErrorResponse, toastCtrl: ToastController): void {
    const message = error.error?.message || "Error del servidor";
    this.showToast(toastCtrl, message);
  }
}

// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    // ...
  ],
};
```

---

## 📋 Plan de Migración Gradual

### Fase 1: Fundación (Semana 1-2)

- [ ] Crear estructura de carpetas `core/`, `shared/`, `features/`
- [ ] Implementar CartStore y CartFacade
- [ ] Separar API services de lógica de negocio

### Fase 2: Features (Semana 3-4)

- [ ] Migrar módulo de Orders a feature module
- [ ] Migrar módulo de Restaurants a feature module
- [ ] Implementar patrones Smart/Presentational

### Fase 3: Optimización (Semana 5-6)

- [ ] Implementar DTOs y Entities
- [ ] Agregar pipes y utilities compartidas
- [ ] Configurar Global Error Handler

### Fase 4: Testing (Semana 7-8)

- [ ] Escribir tests unitarios para facades
- [ ] Escribir tests E2E para flujos críticos
- [ ] Documentar patrones y convenciones

---

## 🎯 Checklist de Buenas Prácticas

### Código

- ✅ **OnPush Change Detection** en componentes presentacionales
- ✅ **Standalone Components** en toda la app
- ✅ **Lazy Loading** para todas las rutas
- ✅ **Signals** para estado reactivo (Angular 17+)
- ✅ **Typed Forms** con FormBuilder
- ✅ **Strict TypeScript** mode habilitado

### Organización

- ✅ **Feature modules** por dominio
- ✅ **Barrel exports** (index.ts) en cada módulo
- ✅ **Path aliases** en tsconfig.json (@core, @shared, @features)

### Performance

- ✅ **Virtual Scrolling** para listas largas
- ✅ **TrackBy** en \*ngFor
- ✅ **Async pipe** en lugar de subscribe
- ✅ **Image lazy loading**

### Seguridad

- ✅ **Sanitización** de inputs
- ✅ **CSRF tokens** en requests
- ✅ **Validación** en cliente y servidor
- ✅ **Refresh token** rotation

---

## 📚 Recursos Recomendados

- [Angular Style Guide](https://angular.io/guide/styleguide)
- [Nx Monorepo Best Practices](https://nx.dev/concepts/decisions)
- [State Management Patterns](https://blog.angular-university.io/angular-2-redux-ngrx-rxjs/)
- [Clean Architecture in Angular](https://dev.to/dalenguyen/clean-architecture-in-angular-5f7a)

---

## 🚀 Conclusión

Tu arquitectura actual es **sólida** pero puede mejorar en:

1. **Escalabilidad** → Feature modules
2. **Mantenibilidad** → Separación de responsabilidades
3. **Testabilidad** → Facades y dependency injection
4. **Performance** → OnPush y optimizaciones

**Recomendación:** Implementa estos patrones **gradualmente**, comenzando por el módulo más crítico (probablemente Orders/Cart).
