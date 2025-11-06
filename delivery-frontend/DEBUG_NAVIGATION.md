# 🧪 Guía de Debugging - Navegación Dinámica

## 📋 Pasos para Probar

### 1. Abre la Consola del Navegador

- Presiona **F12** o **Ctrl+Shift+I**
- Ve a la pestaña **Console**
- Limpia la consola (icono 🚫)

### 2. Prueba desde el Perfil

**Pasos:**

1. Ve a la pestaña **Cuenta** (account)
2. Click en **"Gestionar Direcciones"**
3. Observa los logs en la consola

**Logs Esperados:**

```
🚀 Navigating to addresses from profile
🔍 History state: { returnUrl: '/tabs/account', navigationId: 1 }
🔍 navigationId: 1
✅ Using returnUrl from state: /tabs/account
```

4. Click en el **botón BACK** (←)
5. Deberías regresar a **Cuenta** (/tabs/account)

---

### 3. Prueba desde el Carrito

**Pasos:**

1. Ve a la pestaña **Carrito**
2. Click en **"Seleccionar dirección"** (abre modal)
3. En el modal, click en **"Agregar nueva dirección"**
4. Observa los logs en la consola

**Logs Esperados:**

```
🚀 Navigating to addresses from cart
🔍 History state: { returnUrl: '/tabs/cart', navigationId: 2 }
🔍 navigationId: 2
✅ Using returnUrl from state: /tabs/cart
```

5. Click en el **botón BACK** (←)
6. Deberías regresar a **Carrito** (/tabs/cart)

---

## 🔍 Posibles Problemas y Soluciones

### Problema 1: No veo los logs en la consola

**Causa:** La consola está filtrando mensajes o la app no se recompilado

**Solución:**

```bash
cd c:\laragon\www\delivery-go-fast\delivery-frontend
npm run build
# O si tienes el servidor corriendo:
# Recarga la página (Ctrl+R)
```

---

### Problema 2: Log muestra `undefined` en returnUrl

**Log que ves:**

```
🔍 History state: { navigationId: 1 }
ℹ️ Using default backHref: /tabs/account
```

**Causa:** El state no se está pasando correctamente

**Verificar:**

1. ¿Se ejecutó el log `🚀 Navigating to addresses...`?

   - ❌ No → El método `goToAddresses()` no se está llamando
   - ✅ Sí → Continúa al siguiente paso

2. Verifica que el HTML use `(click)` y no `routerLink`:

   ```html
   <!-- ✅ CORRECTO -->
   <ion-item button (click)="goToAddresses()">
     <!-- ❌ INCORRECTO -->
     <ion-item button routerLink="/tabs/addresses"></ion-item
   ></ion-item>
   ```

---

### Problema 3: El botón BACK no funciona

**Causa:** El `ion-back-button` no está recibiendo el valor dinámico

**Verificar:**

1. Revisa `addresses.page.html`:

   ```html
   <!-- ✅ CORRECTO: Property binding -->
   <ion-back-button [defaultHref]="defaultBackHref"></ion-back-button>

   <!-- ❌ INCORRECTO: String estático -->
   <ion-back-button defaultHref="/tabs/account"></ion-back-button>
   ```

2. Verifica el valor en el componente:
   ```typescript
   // Agrega este log en ionViewWillEnter
   console.log("📍 defaultBackHref is now:", this.defaultBackHref);
   ```

---

### Problema 4: Siempre regresa a /tabs/account

**Log que ves:**

```
🚀 Navigating to addresses from cart
🔍 History state: { returnUrl: '/tabs/cart', navigationId: 2 }
ℹ️ Using default backHref: /tabs/account  ← ❌ PROBLEMA
```

**Causa:** La condición `if (state && state.returnUrl)` no se cumple

**Solución:** Verificar la estructura exacta del state

```typescript
// addresses.page.ts - Versión de debugging mejorada
ionViewWillEnter() {
  const state = window.history.state;

  console.log('🔍 Full state:', JSON.stringify(state, null, 2));
  console.log('🔍 Has returnUrl?', 'returnUrl' in state);
  console.log('🔍 returnUrl value:', state?.returnUrl);
  console.log('🔍 Type of returnUrl:', typeof state?.returnUrl);

  if (state?.returnUrl) {
    this.defaultBackHref = state.returnUrl;
  }

  console.log('📍 Final defaultBackHref:', this.defaultBackHref);
  this.loadAddresses();
}
```

---

### Problema 5: Estado se pierde al recargar

**Comportamiento:** Si recargas la página (F5), `returnUrl` desaparece

**Respuesta:** ✅ **Esto es NORMAL y esperado**

**Explicación:**

- Navigation State es **temporal por diseño**
- Se pierde al recargar la página
- Deep links/bookmarks usan el `defaultBackHref` (/tabs/account)

**No es un bug, es una feature** → Previene URLs con state incorrecto

---

## 🔧 Código de Debugging Completo

Si aún no funciona, reemplaza temporalmente el método:

```typescript
// addresses.page.ts
ionViewWillEnter() {
  console.log('=====================================');
  console.log('🔍 DEBUGGING NAVIGATION STATE');
  console.log('=====================================');

  const state = window.history.state;

  console.log('1️⃣ Full state object:');
  console.log(state);

  console.log('2️⃣ State keys:', Object.keys(state || {}));

  console.log('3️⃣ Has returnUrl property?', 'returnUrl' in (state || {}));

  console.log('4️⃣ returnUrl value:', state?.returnUrl);

  console.log('5️⃣ Current defaultBackHref BEFORE:', this.defaultBackHref);

  if (state && state.returnUrl) {
    console.log('✅ UPDATING defaultBackHref to:', state.returnUrl);
    this.defaultBackHref = state.returnUrl;
  } else {
    console.log('ℹ️ KEEPING default:', this.defaultBackHref);
  }

  console.log('6️⃣ Final defaultBackHref AFTER:', this.defaultBackHref);
  console.log('=====================================');

  this.loadAddresses();
}
```

---

## 📊 Tabla de Diagnóstico

| Síntoma                      | Causa Probable         | Solución                                          |
| ---------------------------- | ---------------------- | ------------------------------------------------- |
| No veo `🚀 Navigating...`    | Método no se llama     | Verificar `(click)="goToAddresses()"` en HTML     |
| `returnUrl` es `undefined`   | State no se pasa       | Verificar `Router.navigate()` con `state: {...}`  |
| Siempre va a `/tabs/account` | Condición falla        | Cambiar `state['returnUrl']` a `state?.returnUrl` |
| Back button no hace nada     | Property binding falta | Usar `[defaultHref]` no `defaultHref`             |
| Funciona 1 vez, luego no     | State se borra         | Normal - usar `ionViewWillEnter()`                |

---

## ✅ Checklist de Verificación

- [ ] Logs de navegación aparecen en consola
- [ ] State muestra `returnUrl` correcto
- [ ] `defaultBackHref` se actualiza correctamente
- [ ] Botón Back regresa a la página correcta
- [ ] Funciona desde Perfil → Direcciones → Back → Perfil
- [ ] Funciona desde Carrito → Direcciones → Back → Carrito
- [ ] Al acceder directo a `/tabs/addresses` usa default

---

## 🚨 Si Nada Funciona

**Última opción: Enfoque alternativo con Query Params**

```typescript
// profile.page.ts
goToAddresses() {
  this.router.navigate(['/tabs/addresses'], {
    queryParams: { from: 'account' }
  });
}

// cart.page.ts
onNavigateToAddresses() {
  this.router.navigate(['/tabs/addresses'], {
    queryParams: { from: 'cart' }
  });
}

// addresses.page.ts
import { ActivatedRoute } from '@angular/router';

private route = inject(ActivatedRoute);

ionViewWillEnter() {
  const from = this.route.snapshot.queryParams['from'];

  if (from === 'cart') {
    this.defaultBackHref = '/tabs/cart';
  } else if (from === 'account') {
    this.defaultBackHref = '/tabs/account';
  }

  this.loadAddresses();
}
```

**Desventaja:** URL fea → `/tabs/addresses?from=account`  
**Ventaja:** Más compatible, más predecible
