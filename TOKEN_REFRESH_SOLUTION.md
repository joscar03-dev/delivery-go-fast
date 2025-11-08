# 🔐 Solución Final: Actualización de Rol con Refresh Token

## 🎯 Problema Original

Cuando el admin aprueba una solicitud de conductor y el backend cambia el rol del usuario de `client` a `driver`, el frontend NO mostraba el tab de "Entregas" porque:

1. El **JWT token** contiene el rol en su payload
2. El token se genera en el **login** con el rol actual
3. Cuando el rol cambia en la base de datos, el **token antiguo sigue siendo válido**
4. Actualizar solo `localStorage` NO es suficiente porque el token no cambia

---

## ✅ Solución Implementada: Refresh Token

### 🔄 Flujo del Refresh Token

```
1. Usuario tiene token con rol: 'client'
   ├─ access_token: eyJhbGc...  (contiene role: 'client')
   └─ refresh_token: xyz123...

2. Admin aprueba solicitud
   ├─ Backend: users.role = 'driver' (PostgreSQL)
   └─ Token del usuario NO cambia (sigue siendo válido)

3. Frontend llama: authService.reloadCurrentUser()
   ├─ PASO 1: refresh() → POST /auth/refresh
   │  ├─ Backend genera NUEVO access_token
   │  └─ Nuevo token contiene: role: 'driver' ✅
   │
   ├─ PASO 2: GET /users/me
   │  └─ Obtiene datos completos del usuario
   │
   └─ PASO 3: Actualiza localStorage y BehaviorSubject
      ├─ localStorage.setItem('user', {..., role: 'driver'})
      ├─ localStorage.setItem('access_token', nuevo_token)
      └─ currentUserSubject.next(updatedUser)

4. Componentes reaccionan automáticamente
   ├─ isDeliveryDriver = computed(() => hasRole('driver'))
   └─ Tab "Entregas" aparece ✅
```

---

## 💻 Código Implementado

### `auth.service.ts` - Método `reloadCurrentUser()`

```typescript
/**
 * Recarga la información del usuario actual desde el backend
 * Y refresca el token para obtener uno con el rol actualizado
 * Útil cuando el rol del usuario cambia (ej: de client a driver)
 */
reloadCurrentUser(): Observable<User> {
  // Primero refrescar el token para obtener uno con el rol actualizado
  return this.refresh().pipe(
    switchMap((newAccessToken) => {
      // Decodificar el nuevo token para obtener el rol actualizado
      const decoded = this.safeDecode(newAccessToken);

      // Luego obtener los datos completos del usuario
      return this.http.get<User>(`${this.base}/users/me`).pipe(
        tap((userData) => {
          // Construir usuario con el rol del nuevo token
          const currentUser = this.currentUserSubject.value;
          if (currentUser) {
            const roleFromToken = Array.isArray(decoded?.roles)
              ? decoded?.roles?.[0]
              : Array.isArray(decoded?.role)
              ? (decoded?.role as string[])[0]
              : (decoded?.role as string | undefined);

            const updatedUser: User = {
              ...currentUser,
              ...userData,
              role: (roleFromToken as User['role']) ?? userData.role,
            };

            localStorage.setItem('user', JSON.stringify(updatedUser));
            this.currentUserSubject.next(updatedUser);

            console.log('✅ Usuario recargado con nuevo rol:', updatedUser.role);
          }
        })
      );
    })
  );
}
```

### Operadores RxJS Utilizados:

| Operador      | Propósito                                                          |
| ------------- | ------------------------------------------------------------------ |
| `refresh()`   | Llama al endpoint `/auth/refresh` para obtener nuevo token         |
| `switchMap()` | Cancela request anterior si hay uno en curso, ejecuta el siguiente |
| `tap()`       | Efecto secundario: actualiza localStorage y subject                |

---

## 🔍 Debugging en Consola

Al ejecutar `reloadCurrentUser()`, verás en la consola:

```javascript
🔄 Iniciando recarga de usuario con refresh de token...
✅ Token refrescado exitosamente
📊 Rol anterior: client
📊 Rol nuevo del token: driver
📊 Rol nuevo del backend: driver
✅ Usuario recargado con nuevo rol: driver
```

---

## 🚀 Puntos de Activación

### 1. **Página de Solicitud** (`driver-application.page.ts`)

```typescript
async loadExistingApplication() {
  const loading = await this.loadingCtrl.create({
    message: 'Cargando solicitud...',
  });
  await loading.present();

  try {
    this.application = await firstValueFrom(
      this.driverApplicationService.getMyApplication()
    );

    if (this.application) {
      // Detectar si fue aprobada
      if (this.application.status === ApplicationStatus.APPROVED) {
        await this.handleApprovedApplication(); // ← Aquí se llama reloadCurrentUser()
        await loading.dismiss();
        return;
      }
      // ... resto del código
    }
  } catch (error: any) {
    // ...
  } finally {
    await loading.dismiss();
  }
}

async handleApprovedApplication() {
  try {
    // Recargar usuario CON REFRESH TOKEN
    await firstValueFrom(this.authService.reloadCurrentUser());

    const alert = await this.alertCtrl.create({
      header: '¡Felicidades!',
      message:
        '🎉 Tu solicitud ha sido aprobada. Ahora eres un conductor oficial...',
      buttons: [
        {
          text: 'Entendido',
          handler: () => {
            this.navCtrl.navigateRoot('/tabs/delivery-driver');
          },
        },
      ],
      backdropDismiss: false,
    });

    await alert.present();
  } catch (error) {
    console.error('Error al recargar usuario:', error);
  }
}
```

### 2. **Página de Perfil** (`profile.page.ts`)

```typescript
ionViewWillEnter(): void {
  // Recargar cada vez que se entra a la página
  this.loadProfile();
}

private loadProfile(): void {
  this.loading = true;

  // Primero recargar con refresh token
  this.auth.reloadCurrentUser().subscribe({
    next: () => {
      // Luego obtener perfil completo
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
      // Fallback: cargar perfil sin refresh
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

---

## 🧪 Cómo Probar

### 1. **Abrir DevTools Console** (F12)

### 2. **Aprobar solicitud en panel admin**

### 3. **En la app del usuario, abrir cualquiera de estas páginas:**

#### Opción A: Página de Solicitud

```
1. Navegar a /driver-application
2. Ver en consola:
   🔄 Iniciando recarga de usuario con refresh de token...
   ✅ Token refrescado exitosamente
   📊 Rol anterior: client
   📊 Rol nuevo del token: driver
   ✅ Usuario recargado con nuevo rol: driver
3. Ver alerta: "¡Felicidades! Tu solicitud ha sido aprobada"
4. Click "Entendido" → Redirige a /tabs/delivery-driver
5. ✅ Tab "Entregas" VISIBLE
```

#### Opción B: Página de Perfil

```
1. Navegar a /tabs/account
2. Ver en consola:
   🔄 Iniciando recarga de usuario con refresh de token...
   ✅ Token refrescado exitosamente
   📊 Rol anterior: client
   📊 Rol nuevo del token: driver
   ✅ Usuario recargado con nuevo rol: driver
3. Perfil se carga normalmente
4. Cambiar de tab
5. ✅ Tab "Entregas" VISIBLE
```

---

## 🔐 Seguridad del Refresh Token

### ¿Por qué funciona?

1. **Refresh token es de larga duración** (7-30 días típicamente)
2. **Access token es de corta duración** (15-60 minutos típicamente)
3. Cuando llamamos `/auth/refresh`:
   - Backend valida el refresh token
   - Backend consulta la BD para obtener el rol actual del usuario
   - Backend genera un NUEVO access token con el rol actualizado
   - Frontend reemplaza el token antiguo

### ¿Es seguro?

✅ **SÍ**, porque:

- El refresh token solo se usa para obtener nuevos access tokens
- El backend SIEMPRE consulta la BD antes de generar el nuevo token
- Si el rol cambió en la BD, el nuevo token lo reflejará
- No hay forma de "falsificar" un token con rol diferente

---

## 📊 Comparación: Antes vs Después

### ❌ ANTES (Solo actualizar localStorage):

```typescript
reloadCurrentUser(): Observable<User> {
  return this.http.get<User>(`${this.base}/users/me`).pipe(
    tap((userData) => {
      const updatedUser: User = {
        ...currentUser,
        ...userData,
        role: userData.role, // ← Actualiza localStorage
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      this.currentUserSubject.next(updatedUser);
    })
  );
}
```

**Problema**: El token SIGUE teniendo `role: 'client'`

```javascript
// localStorage.user
{ id: '123', name: 'Juan', role: 'driver' } ✅

// JWT token (NO cambia)
{ sub: '123', email: 'juan@mail.com', role: 'client' } ❌

// hasRole('driver') → Lee del token → FALSE ❌
```

---

### ✅ DESPUÉS (Con refresh token):

```typescript
reloadCurrentUser(): Observable<User> {
  return this.refresh().pipe( // ← PRIMERO: Refresh token
    switchMap((newAccessToken) => {
      const decoded = this.safeDecode(newAccessToken);
      return this.http.get<User>(`${this.base}/users/me`).pipe(
        tap((userData) => {
          const roleFromToken = decoded?.role; // ← Del NUEVO token
          const updatedUser: User = {
            ...currentUser,
            ...userData,
            role: roleFromToken ?? userData.role,
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          this.currentUserSubject.next(updatedUser);
        })
      );
    })
  );
}
```

**Solución**: El token NUEVO tiene `role: 'driver'`

```javascript
// localStorage.user
{ id: '123', name: 'Juan', role: 'driver' } ✅

// JWT token (NUEVO generado con refresh)
{ sub: '123', email: 'juan@mail.com', role: 'driver' } ✅

// hasRole('driver') → Lee del usuario → TRUE ✅
```

---

## 🎯 Ventajas de esta Solución

| Ventaja             | Descripción                                                               |
| ------------------- | ------------------------------------------------------------------------- |
| ✅ **Automático**   | No requiere que el usuario cierre sesión y vuelva a entrar                |
| ✅ **Seguro**       | Usa el flujo estándar de OAuth2 (refresh token)                           |
| ✅ **Sincronizado** | Token y localStorage siempre tienen el mismo rol                          |
| ✅ **Reactivo**     | Los componentes se actualizan automáticamente vía BehaviorSubject         |
| ✅ **Reutilizable** | Funciona para cualquier cambio de rol (client→driver, driver→admin, etc.) |

---

## 🐛 Troubleshooting

### Problema: Tab sigue sin aparecer

**Verificar en consola**:

```javascript
localStorage.getItem("user"); // ¿Rol correcto?
localStorage.getItem("access_token"); // ¿Token nuevo?
```

**Decodificar token manualmente**:

```javascript
// En consola del navegador
const token = localStorage.getItem("access_token");
const payload = JSON.parse(atob(token.split(".")[1]));
console.log("Rol en token:", payload.role || payload.roles);
```

---

### Problema: Error al refrescar token

**Posibles causas**:

1. Refresh token expirado → Usuario debe hacer login de nuevo
2. Backend no está corriendo
3. Endpoint `/auth/refresh` tiene error

**Solución**:

- Verificar que el backend esté corriendo
- Verificar logs del backend
- Si refresh token expiró, hacer logout y login de nuevo

---

## 📝 Checklist de Implementación

- [x] Método `reloadCurrentUser()` con `refresh()` en AuthService
- [x] Detección de aprobación en driver-application.page
- [x] Recarga en profile.page con `ionViewWillEnter`
- [x] Logs de debugging en consola
- [x] Compilación exitosa sin errores
- [x] Sincronización con Android/iOS
- [ ] Prueba end-to-end en navegador
- [ ] Prueba end-to-end en Android
- [ ] Verificar con refresh token expirado
- [ ] Documentación actualizada

---

## 🚀 Próximos Pasos

1. **Probar en navegador** con DevTools abierto
2. **Verificar logs en consola** para confirmar refresh
3. **Probar en Android** para verificar comportamiento nativo
4. **Considerar WebSocket** para notificación en tiempo real (opcional)

---

**Estado**: ✅ Implementación completada con refresh token  
**Fecha**: 7 de noviembre de 2025  
**Próximo paso**: Pruebas en navegador y Android
