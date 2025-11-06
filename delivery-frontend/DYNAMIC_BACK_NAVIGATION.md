# 🔙 Navegación Dinámica con ion-back-button

## Problema

La página de direcciones (`/tabs/addresses`) se puede acceder desde **múltiples lugares**:

1. **Desde el Perfil** → debe regresar a `/tabs/tab3` (Account)
2. **Desde el Carrito** → debe regresar a `/tabs/cart`

El `ion-back-button` con `defaultHref` estático no funciona para este caso.

---

## ✅ Solución Implementada: Navigation State

Usamos **Angular Navigation State** para pasar información sobre la ruta de origen.

### 1. AddressesPage - Recibe el returnUrl

```typescript
// addresses.page.ts
export class AddressesPage implements OnInit {
  // Ruta de retorno dinámica (default: perfil)
  defaultBackHref = "/tabs/tab3";

  ngOnInit() {
    // Obtener la ruta de retorno desde el navigation state
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || history.state;

    if (state && state["returnUrl"]) {
      this.defaultBackHref = state["returnUrl"];
    }

    this.loadAddresses();
  }
}
```

### 2. Template - Usa la propiedad dinámica

```html
<!-- addresses.page.html -->
<ion-header>
  <ion-toolbar>
    <ion-buttons slot="start">
      <!-- ✅ Usa property binding para valor dinámico -->
      <ion-back-button [defaultHref]="defaultBackHref"></ion-back-button>
    </ion-buttons>
    <ion-title>Mis Direcciones</ion-title>
  </ion-toolbar>
</ion-header>
```

### 3. Navegación desde Carrito - Pasa el state

```typescript
// cart.page.ts
async onNavigateToAddresses(modal: any): Promise<void> {
  await modal.dismiss();

  // ✅ Pasa el returnUrl en el state
  await this.router.navigate(['/tabs/addresses'], {
    state: { returnUrl: '/tabs/cart' }
  });
}
```

### 4. Navegación desde Perfil - Pasa el state programáticamente

**⚠️ IMPORTANTE**: No puedes pasar `state` usando `routerLink` directamente en el template.  
Debes usar **navegación programática** con `Router.navigate()`.

```typescript
// profile.page.ts
export class ProfilePage implements OnInit {
  private router = inject(Router);

  goToAddresses() {
    this.router.navigate(["/tabs/addresses"], {
      state: { returnUrl: "/tabs/account" }, // ✅ Pasa el state
    });
  }
}
```

```html
<!-- profile.page.html -->
<!-- ❌ INCORRECTO: routerLink no puede pasar state -->
<ion-item button routerLink="/tabs/addresses">
  <ion-label>Mis Direcciones</ion-label>
</ion-item>

<!-- ✅ CORRECTO: usar (click) con método -->
<ion-item button (click)="goToAddresses()">
  <ion-icon name="location-outline" slot="start"></ion-icon>
  <ion-label>
    <h2>Gestionar Direcciones</h2>
    <p>Ver y editar mis direcciones de entrega</p>
  </ion-label>
  <ion-icon name="chevron-forward-outline" slot="end"></ion-icon>
</ion-item>
```

---

## 📊 Flujos de Navegación

### Flujo 1: Desde Perfil

```
Perfil (/tabs/account)
    ↓
    [Click "Gestionar Direcciones"]
    goToAddresses() → navigate con state: { returnUrl: '/tabs/account' }
    ↓
Direcciones (/tabs/addresses)
    defaultBackHref = "/tabs/account" (desde state)
    ↓
    [Click ion-back-button]
    ↓
Perfil (/tabs/account) ✅
```

```
Perfil (/tabs/tab3)
    ↓
    [Click "Mis Direcciones"]
    ↓
Direcciones (/tabs/addresses)
    defaultBackHref = "/tabs/tab3" (default)
    ↓
    [Click ion-back-button]
    ↓
Perfil (/tabs/tab3) ✅
```

### Flujo 2: Desde Carrito

```
Carrito (/tabs/cart)
    ↓
    [Modal selector → "Agregar dirección"]
    ↓
    navigate(['/tabs/addresses'], { state: { returnUrl: '/tabs/cart' } })
    ↓
Direcciones (/tabs/addresses)
    defaultBackHref = "/tabs/cart" (desde state)
    ↓
    [Click ion-back-button]
    ↓
Carrito (/tabs/cart) ✅
```

---

## 🎯 Ventajas de esta Solución

✅ **No requiere query params** → URLs limpias  
✅ **Funciona con ion-back-button nativo** → UX consistente  
✅ **Flexible** → Fácil agregar más orígenes  
✅ **State se pierde al recargar** → No afecta bookmarks/deep links  
✅ **TypeScript type-safe** → Con interfaces para state

---

## 🔄 Alternativas Consideradas

### ❌ Opción 1: Query Params

```typescript
// Navegación
this.router.navigate(['/tabs/addresses'], {
  queryParams: { returnUrl: '/tabs/cart' }
});

// URL resultante
/tabs/addresses?returnUrl=%2Ftabs%2Fcart  // ❌ URL fea
```

**Problemas:**

- URLs feas con caracteres codificados
- Persiste en bookmarks (puede ser indeseado)

### ❌ Opción 2: Servicio Compartido

```typescript
// NavigationService
setReturnUrl(url: string) {
  this.returnUrl = url;
}
```

**Problemas:**

- Estado global mutable
- Puede causar bugs si no se limpia
- Más código para mantener

### ✅ Opción 3: Navigation State (IMPLEMENTADA)

La mejor opción para este caso de uso.

---

## 📚 Extensión Futura

Si necesitas más orígenes, solo agrega el state:

```typescript
// Desde search
this.router.navigate(["/tabs/addresses"], {
  state: { returnUrl: "/tabs/search" },
});

// Desde order-detail
this.router.navigate(["/tabs/addresses"], {
  state: { returnUrl: "/tabs/order-detail/" + orderId },
});
```

---

## 🧪 Testing

```typescript
// addresses.page.spec.ts
it("should use default back href when no state provided", () => {
  const component = new AddressesPage(/* deps */);
  component.ngOnInit();
  expect(component.defaultBackHref).toBe("/tabs/tab3");
});

it("should use return url from navigation state", () => {
  // Mock router con state
  const mockRouter = {
    getCurrentNavigation: () => ({
      extras: { state: { returnUrl: "/tabs/cart" } },
    }),
  };

  const component = new AddressesPage(mockRouter as any /* otros deps */);
  component.ngOnInit();
  expect(component.defaultBackHref).toBe("/tabs/cart");
});
```

---

## 📖 Referencias

- [Angular Router NavigationExtras](https://angular.io/api/router/NavigationExtras)
- [Ionic ion-back-button](https://ionicframework.com/docs/api/back-button)
- [Navigation State Pattern](https://angular.io/guide/router#passing-data-to-a-route)
