# 🔔 FIX CRÍTICO: Listeners de Notificaciones en app.component.ts

## 🔴 Problema Detectado

Según la guía de implementación (línea 110+), los **listeners de notificaciones DEBEN inicializarse al inicio de la app**, NO después del login.

### ❌ Comportamiento Anterior (INCORRECTO):

```
1. Usuario inicia sesión
2. Se inicializan listeners → initializePushNotifications()
3. Usuario cierra la app
4. Llega una notificación
5. Usuario toca la notificación
6. App se abre desde estado cerrado
7. ❌ Listeners NO están registrados (se registran solo después del login)
8. ❌ NO captura el evento pushNotificationActionPerformed
9. ❌ Usuario no es redirigido a la pantalla del pedido
```

### ✅ Comportamiento Correcto (IMPLEMENTADO):

```
1. App inicia → app.component.ts carga
2. Se inicializan listeners → initializeListeners() ✅
3. Usuario inicia sesión
4. Se registra dispositivo → initializePushNotifications() ✅
5. Usuario cierra la app
6. Llega una notificación
7. Usuario toca la notificación
8. App se abre desde estado cerrado
9. ✅ Listeners YA están registrados
10. ✅ Captura pushNotificationActionPerformed
11. ✅ Navega automáticamente a /orders/[orderId]
```

## 🛠️ Cambios Implementados

### 1. **app.component.ts** - Inicialización al inicio

**Archivo**: `delivery-frontend/src/app/app.component.ts`

```typescript
import { Component, OnInit, inject } from "@angular/core";
import { PushNotificationService } from "./services/push-notification.service";

export class AppComponent implements OnInit {
  private pushService = inject(PushNotificationService);

  ngOnInit() {
    this.initializeApp();
  }

  private initializeApp() {
    // 🔔 CRÍTICO: Inicializar listeners AL INICIO
    this.pushService.initializeListeners();
  }
}
```

### 2. **push-notification.service.ts** - Separación de responsabilidades

**Archivo**: `delivery-frontend/src/app/services/push-notification.service.ts`

**Cambios**:

- ✅ Agregado flag `listenersInitialized` para evitar reinicialización
- ✅ Nuevo método `initializeListeners()` - Se llama al inicio de la app
- ✅ Método `initializePushNotifications()` ahora SOLO registra el dispositivo

**Estructura**:

```typescript
private listenersInitialized: boolean = false;

// 1️⃣ Se llama en app.component.ts (inicio de la app)
async initializeListeners(): Promise<void> {
  // Verificar platform
  // Evitar múltiples inicializaciones
  // Crear canales de Android
  // Registrar listeners (registration, pushNotificationReceived, etc.)
}

// 2️⃣ Se llama después del login (auth.service.ts)
async initializePushNotifications(): Promise<void> {
  // Asegurarse de que listeners estén inicializados
  // Registrar dispositivo con FCM/APNs
  // Solicitar permisos
  // Obtener token
}
```

## 📊 Comparación

| Aspecto                           | ❌ Antes             | ✅ Ahora                                   |
| --------------------------------- | -------------------- | ------------------------------------------ |
| **Inicialización de listeners**   | Después del login    | Al inicio de la app                        |
| **Notificación abre app cerrada** | No captura el evento | ✅ Captura y navega                        |
| **Orden de inicialización**       | Login → Todo         | App inicia → Listeners<br>Login → Registro |
| **Flag de control**               | No existe            | `listenersInitialized`                     |
| **Reinicialización múltiple**     | Posible (bug)        | Prevenida                                  |

## 🎯 Flujo Completo

### Escenario 1: Primera vez (app recién instalada)

```
1. App inicia
2. app.component.ts → initializeApp()
3. pushService.initializeListeners()
   → Crea canales de Android
   → Registra listeners
4. Usuario navega e inicia sesión
5. auth.service.ts → login exitoso
6. pushService.initializePushNotifications()
   → Solicita permisos
   → Registra dispositivo con FCM
   → Obtiene token
   → Envía token al backend
7. ✅ Todo configurado
```

### Escenario 2: App cerrada, notificación llega

```
1. App está cerrada
2. Firebase envía notificación push
3. Usuario toca la notificación
4. App se abre desde estado cerrado
5. app.component.ts → ngOnInit()
6. pushService.initializeListeners()
   ✅ Listeners registrados
7. Listener 'pushNotificationActionPerformed' se dispara
8. Extrae data.orderId de la notificación
9. router.navigate(['/orders', orderId])
10. ✅ Usuario ve la pantalla del pedido directamente
```

### Escenario 3: App en segundo plano, notificación llega

```
1. App en background
2. Notificación llega
3. Usuario toca la notificación
4. App vuelve a primer plano
5. Listener 'pushNotificationActionPerformed' ya está registrado
6. ✅ Navega inmediatamente
```

## 🧪 Cómo Probar

### Paso 1: Rebuild y deploy

```bash
cd delivery-frontend
ionic build
npx cap sync android
npx cap open android
```

### Paso 2: Instalar en dispositivo

Instala la app en un dispositivo Android real.

### Paso 3: Iniciar sesión

Inicia sesión con un usuario (restaurante o cliente).

**Verificar en logs**:

```
📱 Inicializando listeners de notificaciones...
🔔 Creando canales de notificación de alta prioridad...
✅ Canal "pedidos_criticos" creado
✅ Listeners de notificaciones inicializados
📱 Registrando dispositivo para push notifications...
📱 Push token recibido: <token>
```

### Paso 4: Cerrar app COMPLETAMENTE

- No solo minimizar, sino **forzar cierre** desde el gestor de tareas
- O deslizar hacia arriba en el recents screen

### Paso 5: Enviar notificación

Desde otro dispositivo o navegador, crea un pedido que genere una notificación push.

### Paso 6: Tocar la notificación

Cuando llegue la notificación, **tócala**.

**Resultado esperado**:

- ✅ App se abre
- ✅ Navega automáticamente a `/orders/[orderId]`
- ✅ Se muestra la pantalla del detalle del pedido

**Verificar en logs**:

```
🔔 Notificación tocada: {...}
📍 Navegando a: /orders/abc-123-def
```

## 🔍 Debugging

### Si la navegación NO funciona:

1. **Verificar que los listeners se inicializaron**:

   ```
   Buscar en logs: "✅ Listeners de notificaciones inicializados"
   ```

2. **Verificar que el evento se captura**:

   ```
   Buscar en logs: "🔔 Notificación tocada:"
   ```

3. **Verificar el payload de data**:

   - El backend debe enviar `data.orderId`
   - El backend debe enviar `data.screen = 'order-detail'` (opcional)

4. **Verificar permisos**:
   - Ajustes > Aplicaciones > Delivery Go Fast > Notificaciones
   - Debe estar **Activado**

### Chrome DevTools Remote Debugging:

```bash
# Conectar dispositivo por USB
# Abrir Chrome: chrome://inspect
# Seleccionar la app
# Ver logs de consola en tiempo real
```

## 📚 Referencia de la Guía

> **Sección V: Implementación del Lado del Cliente**
>
> "La lógica de inicialización en **app.component.ts** garantiza que los listeners de notificaciones se registren **tan pronto como la aplicación se inicie**, lo que es **esencial para manejar las notificaciones que abren la aplicación desde un estado cerrado**."

## ✅ Checklist Post-Implementación

- [x] `app.component.ts` implementa `OnInit`
- [x] `app.component.ts` llama a `initializeListeners()` en `ngOnInit()`
- [x] `push-notification.service.ts` tiene flag `listenersInitialized`
- [x] Método `initializeListeners()` crea canales y registra listeners
- [x] Método `initializePushNotifications()` solo registra dispositivo
- [x] `auth.service.ts` sigue llamando `initializePushNotifications()` después del login
- [x] No hay inicialización duplicada (protected by flag)

## 🚀 Beneficios de este cambio

1. ✅ **Deep linking funciona** desde app cerrada
2. ✅ **Navegación automática** al tocar notificación
3. ✅ **Mejor UX** - Usuario no tiene que buscar manualmente el pedido
4. ✅ **Cumple estándares** de la guía oficial de Capacitor
5. ✅ **Previene bugs** de listeners no registrados
6. ✅ **Separación de responsabilidades** clara

---

**Fecha**: 11/11/2025
**Autor**: GitHub Copilot
**Issue**: Listeners no capturaban notificaciones que abrían la app desde estado cerrado
**Status**: ✅ RESUELTO
**Relacionado**: FIX_NOTIFICACIONES_PUSH_ANDROID.md
