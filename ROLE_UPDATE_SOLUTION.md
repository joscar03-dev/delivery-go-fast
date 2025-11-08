# 🔄 Solución: Actualización Automática de Rol Driver

## 🐛 Problema Identificado

**Síntoma**: Cuando el admin aprueba una solicitud de conductor y el usuario se convierte en driver, el tab de entregas no aparece automáticamente, ni siquiera al recargar la página.

**Causa Raíz**:

- El backend **SÍ** actualiza el rol del usuario a `driver` cuando se aprueba la solicitud
- El frontend almacena el rol en `localStorage` basándose en el **JWT token** al momento del login
- Cuando el rol cambia en la base de datos, el **token antiguo sigue siendo válido** pero contiene el rol anterior (`client`)
- El frontend nunca recarga la información del usuario desde el backend automáticamente

---

## ✅ Solución Implementada

Se implementó un sistema de **recarga automática del usuario** en puntos estratégicos para detectar cambios de rol.

### 1. **Nuevo Método en AuthService**: `reloadCurrentUser()`

**Ubicación**: `src/app/services/auth.service.ts`

```typescript
/**
 * Recarga la información del usuario actual desde el backend
 * Útil cuando el rol del usuario cambia (ej: de client a driver)
 */
reloadCurrentUser(): Observable<User> {
  return this.http.get<User>(`${this.base}/users/me`).pipe(
    tap((userData) => {
      // Actualizar el usuario en localStorage y subject
      const currentUser = this.currentUserSubject.value;
      if (currentUser) {
        const updatedUser: User = {
          ...currentUser,
          ...userData,
          role: userData.role, // Asegurar que el rol se actualice
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        this.currentUserSubject.next(updatedUser);
      }
    })
  );
}
```

**Función**:

- Hace un GET a `/users/me` para obtener datos actualizados del backend
- Actualiza el `localStorage` con el nuevo rol
- Actualiza el `BehaviorSubject` que notifica a todos los componentes
- **No requiere nuevo login**

---

### 2. **Detección en Página de Solicitud**: `driver-application.page.ts`

**Ubicación**: `src/app/driver-application/driver-application.page.ts`

#### Cambios:

**a) Inyección de AuthService**:

```typescript
constructor(
  private fb: FormBuilder,
  private driverApplicationService: DriverApplicationService,
  private loadingCtrl: LoadingController,
  private alertCtrl: AlertController,
  private navCtrl: NavController,
  private authService: AuthService // ← NUEVO
) {
```

**b) Verificación en `loadExistingApplication()`**:

```typescript
if (this.application.status === ApplicationStatus.APPROVED) {
  await this.handleApprovedApplication();
  await loading.dismiss();
  return;
}
```

**c) Nuevo método `handleApprovedApplication()`**:

```typescript
async handleApprovedApplication() {
  try {
    // Recargar la información del usuario desde el backend
    await firstValueFrom(this.authService.reloadCurrentUser());

    const alert = await this.alertCtrl.create({
      header: '¡Felicidades!',
      message:
        '🎉 Tu solicitud ha sido aprobada. Ahora eres un conductor oficial de Delivery Go Fast. La app se recargará para activar tus nuevas funciones.',
      buttons: [
        {
          text: 'Entendido',
          handler: () => {
            // Redirigir al tab de entregas para conductores
            this.navCtrl.navigateRoot('/tabs/delivery-driver');
          },
        },
      ],
      backdropDismiss: false,
    });

    await alert.present();
  } catch (error) {
    console.error('Error al recargar usuario:', error);
    await this.showAlert(
      'Información',
      'Tu solicitud ha sido aprobada. Por favor, cierra sesión y vuelve a iniciar sesión para ver tus nuevas funciones de conductor.'
    );
  }
}
```

**Flujo**:

1. Usuario abre la página de solicitud
2. Se carga la solicitud desde el backend
3. Si status = `APPROVED` → Recarga usuario → Muestra alerta de felicitación → Redirige a `/tabs/delivery-driver`

---

### 3. **Recarga en Perfil**: `profile.page.ts`

**Ubicación**: `src/app/pages/profile/profile.page.ts`

#### Cambios:

**a) Nuevo hook `ionViewWillEnter()`**:

```typescript
ionViewWillEnter(): void {
  // Recargar el perfil cada vez que se entra a la página
  // Esto asegura que el rol esté actualizado si fue aprobado como driver
  this.loadProfile();
}
```

**b) Método `loadProfile()` mejorado**:

```typescript
private loadProfile(): void {
  this.loading = true;

  // Primero recargar el usuario actual para actualizar el rol
  this.auth.reloadCurrentUser().subscribe({
    next: () => {
      // Luego obtener el perfil completo
      this.userService.getProfile().subscribe({
        next: (u) => {
          this.user = u;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading profile:', err);
          this.loading = false;
        },
      });
    },
    error: (err) => {
      console.error('Error reloading user:', err);
      // Si falla, intentar cargar el perfil de todas formas
      this.userService.getProfile().subscribe({
        next: (u) => {
          this.user = u;
          this.loading = false;
        },
        error: (err2) => {
          console.error('Error loading profile:', err2);
          this.loading = false;
        },
      });
    },
  });
}
```

**Flujo**:

1. Usuario entra a la página de perfil (cada vez)
2. Se recarga el usuario desde el backend
3. Si el rol cambió, todos los computed signals se actualizan automáticamente
4. Los tabs aparecen/desaparecen según el nuevo rol

---

## 🔄 Flujo Completo de Actualización

```
1. Admin aprueba solicitud en panel admin
   ├─ Backend: updateStatus() → Cambia status a APPROVED
   └─ Backend: updateUserRole() → Cambia rol de 'client' a 'driver'

2. Usuario abre la app (todavía tiene rol 'client' en localStorage)

3. Usuario navega a:

   OPCIÓN A: Página de solicitud (/driver-application)
   ├─ loadExistingApplication()
   ├─ Detecta status = APPROVED
   ├─ handleApprovedApplication()
   │  ├─ authService.reloadCurrentUser() → Actualiza rol en localStorage
   │  ├─ Muestra alerta de felicitación
   │  └─ Redirige a /tabs/delivery-driver
   └─ TabsPage.isDeliveryDriver computed() → Detecta nuevo rol
      └─ Tab "Entregas" aparece automáticamente

   OPCIÓN B: Página de perfil (/tabs/account)
   ├─ ionViewWillEnter()
   ├─ loadProfile()
   │  └─ authService.reloadCurrentUser() → Actualiza rol
   └─ Al volver a tabs, el computed detecta el cambio
      └─ Tab "Entregas" aparece automáticamente
```

---

## 🎯 Puntos de Recarga Implementados

| Ubicación                 | Trigger              | Método                      | Propósito                                      |
| ------------------------- | -------------------- | --------------------------- | ---------------------------------------------- |
| `driver-application.page` | `ngOnInit()`         | `loadExistingApplication()` | Detectar aprobación al abrir solicitud         |
| `profile.page`            | `ionViewWillEnter()` | `loadProfile()`             | Actualizar rol cada vez que se entra al perfil |
| `auth.service`            | Manual               | `reloadCurrentUser()`       | Método utilitario reutilizable                 |

---

## 📱 Experiencia del Usuario

### Escenario 1: Usuario abre solicitud después de aprobación

```
1. Usuario abre /driver-application
2. Loading: "Cargando solicitud..."
3. ✅ Detecta status = APPROVED
4. Loading: "Actualizando información..."
5. 🎉 Alerta: "¡Felicidades! Tu solicitud ha sido aprobada..."
6. [Botón: Entendido]
7. → Redirige a /tabs/delivery-driver
8. Tab "Entregas" visible y activo
```

### Escenario 2: Usuario entra a perfil

```
1. Usuario navega a /tabs/account
2. Loading: Spinner mientras recarga
3. ✅ Rol actualizado silenciosamente
4. Perfil muestra datos actualizados
5. Al cambiar de tab, "Entregas" aparece
```

### Escenario 3: Usuario recarga la página

```
1. F5 o pull-to-refresh
2. ionViewWillEnter() se dispara
3. Rol se actualiza automáticamente
4. Tabs se reorganizan según nuevo rol
```

---

## 🧪 Cómo Probar

### Prueba Manual:

1. **Crear cuenta nueva**:

   ```
   - Registrarse como cliente
   - Verificar que rol = 'client'
   - Verificar que NO aparece tab "Entregas"
   ```

2. **Solicitar ser conductor**:

   ```
   - Ir a Perfil → "Solicitar ser Conductor"
   - Completar Paso 1 → Enviar
   ```

3. **Admin aprueba llamada**:

   ```
   - Login como super_admin en otro dispositivo
   - Ir a Panel Admin → Solicitudes de Conductores
   - Click en solicitud → "Aprobar Llamada"
   ```

4. **Usuario completa Paso 2**:

   ```
   - Volver a la app del usuario
   - Abrir /driver-application
   - Completar Paso 2 con fotos
   - Enviar solicitud final
   ```

5. **Admin aprueba solicitud final**:

   ```
   - En panel admin: "Aprobar Solicitud"
   ```

6. **Verificar actualización automática** (CRÍTICO):

   ```
   PRUEBA A: Usuario abre /driver-application
   ├─ ✅ Debe mostrar alerta de felicitación
   ├─ ✅ Al cerrar alerta, redirige a /tabs/delivery-driver
   └─ ✅ Tab "Entregas" visible

   PRUEBA B: Usuario navega a /tabs/account
   ├─ ✅ Rol se actualiza silenciosamente
   ├─ ✅ Al cambiar de tab, "Entregas" visible
   └─ ✅ Click en "Entregas" abre módulo de conductor

   PRUEBA C: Usuario recarga página (F5)
   ├─ ✅ Rol se mantiene actualizado
   └─ ✅ Tab "Entregas" sigue visible
   ```

---

## 🐛 Problemas Conocidos y Soluciones

### Problema: Tab no aparece inmediatamente

**Causa**: `TabsPage.isDeliveryDriver` es un `computed()` que depende de `auth.hasRole()`

**Solución**: El `computed()` se recalcula automáticamente cuando `currentUserSubject` emite un nuevo valor

---

### Problema: Usuario cierra sesión y vuelve a entrar

**Causa**: El token se regenera al hacer login, ya tiene el rol correcto

**Solución**: No requiere acción, funciona correctamente

---

### Problema: Token expira antes de que usuario vea cambio

**Causa**: Token tiene rol antiguo, expira, usuario hace refresh

**Solución**: El `refresh()` obtiene un nuevo token con el rol actualizado del backend

---

## 📊 Flujo de Datos del Rol

```
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND (NestJS)                          │
├─────────────────────────────────────────────────────────────────┤
│ 1. updateStatus(APPROVED)                                       │
│    ├─ application.status = 'approved'                           │
│    └─ usersService.updateUserRole(userId, 'driver')             │
│                                                                  │
│ 2. users.role = 'driver' (PostgreSQL)                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (Angular/Ionic)                    │
├─────────────────────────────────────────────────────────────────┤
│ 3. auth.reloadCurrentUser()                                     │
│    ├─ GET /users/me                                             │
│    ├─ Recibe: { id, name, email, role: 'driver' }              │
│    ├─ Actualiza localStorage                                    │
│    └─ currentUserSubject.next(updatedUser)                      │
│                                                                  │
│ 4. computed() en TabsPage se recalcula                          │
│    ├─ isDeliveryDriver = computed(() => hasRole('driver'))      │
│    └─ Resultado: true                                           │
│                                                                  │
│ 5. Template actualiza automáticamente                           │
│    └─ *ngIf="isDeliveryDriver()" → Tab visible                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist de Implementación

- [x] Método `reloadCurrentUser()` en AuthService
- [x] Detección de aprobación en driver-application.page
- [x] Alerta de felicitación con redirección
- [x] Recarga en ionViewWillEnter del perfil
- [x] Compilación exitosa sin errores
- [ ] Pruebas manuales end-to-end
- [ ] Verificar en dispositivo Android
- [ ] Verificar con token expirado
- [ ] Documentación actualizada

---

## 🚀 Mejoras Futuras (Opcional)

### 1. **WebSocket para Actualización en Tiempo Real**

```typescript
// En approval, backend emite evento
this.socketGateway.emitToUser(userId, "role-updated", { role: "driver" });

// Frontend escucha evento
this.socket.on("role-updated", (data) => {
  this.authService.reloadCurrentUser().subscribe();
});
```

### 2. **Polling Periódico**

```typescript
// Verificar cambios de rol cada 30 segundos (solo cuando app está activa)
interval(30000)
  .pipe(
    filter(() => this.isActive),
    switchMap(() => this.auth.reloadCurrentUser())
  )
  .subscribe();
```

### 3. **Push Notification**

```
Admin aprueba → Backend envía push → Usuario tap notification → Recarga rol
```

---

**Estado**: ✅ Implementación completada y compilación exitosa  
**Fecha**: 7 de noviembre de 2025  
**Próximo paso**: Probar flujo completo en dispositivo Android
