# 🔧 Solución: Error 39 al Enviar OTP (Phone Login)

## 🎯 Problema Específico

**Síntoma**:

- ✅ Usuario se registra con teléfono → funciona, recibe SMS
- ✅ Después hace login con teléfono → funciona, recibe SMS
- ❌ Usuario **NO registrado** intenta login → **Error 39**, NO recibe SMS

**Causa Raíz**:
Firebase App Check está en modo **"Enforce"** (protección activada). Cuando un usuario **no registrado** intenta hacer login con teléfono, Firebase detecta que:

1. El usuario no existe en Firebase Authentication
2. App Check está en modo estricto
3. Rechaza la solicitud con Error 39 **ANTES** de enviar el SMS

## ✅ Solución Inmediata (5 minutos)

### Paso 1: Cambiar App Check a "Monitoring"

1. Ir a Firebase Console: https://console.firebase.google.com
2. Proyecto: **delivery-go-fast**
3. Menú → **Build** → **App Check**
4. Tab **"Apps"**
5. Seleccionar: **com.deliverygofast1.app**
6. Buscar sección: **"Enforcement"**

```
┌────────────────────────────────────────────────┐
│ Enforcement                                     │
│                                                 │
│ ● Monitoring (recommended for new apps)  ← ✅  │
│   Collect metrics but don't block requests     │
│                                                 │
│ ○ Enforce protection                            │
│   Block requests without valid tokens          │
│                                                 │
│ [Save]                                          │
└────────────────────────────────────────────────┘
```

7. Seleccionar: **"Monitoring"**
8. Click **"Save"**
9. ⏱️ Esperar 2-5 minutos para propagación

### Paso 2: Probar Phone Login

1. **Desinstalar** la app completamente
2. **Reinstalar** desde Play Store (prueba interna)
3. **NO hacer registro**, ir directo a Phone Login
4. Ingresar teléfono: `+51927885314`
5. **Resultado esperado**:
   - ✅ SMS llega correctamente
   - ✅ Usuario puede verificar código
   - ✅ Backend responde: "Usuario no registrado. Por favor regístrate primero."
   - ✅ Se muestra diálogo para registrarse

---

## 🔍 ¿Por Qué Pasa Esto?

### Flujo con App Check en "Enforce" (modo estricto)

```
Usuario → [Enviar OTP] → Firebase Phone Auth
                          ↓
                     App Check verifica:
                     - ¿App auténtica? ✅
                     - ¿Usuario existe? ❌
                          ↓
                   🚫 Error 39: Bloqueado
                   (No se envía SMS)
```

### Flujo con App Check en "Monitoring" (modo permisivo)

```
Usuario → [Enviar OTP] → Firebase Phone Auth
                          ↓
                     App Check verifica:
                     - ¿App auténtica? ✅
                     - ¿Usuario existe? ❌
                          ↓
                   ✅ Permite continuar
                   📨 Envía SMS
                          ↓
              Usuario verifica código
                          ↓
              Backend valida token
                          ↓
           🔍 Usuario no existe en BD
                          ↓
      Muestra diálogo: "¿Deseas registrarte?"
```

---

## 🔐 Seguridad: ¿Es Seguro Usar "Monitoring"?

**Sí, es seguro para tu caso de uso**. Aquí está por qué:

### ✅ Protecciones que SIGUEN activas:

1. **Play Integrity verifica** que la app sea auténtica
2. **Firebase valida** que el token de OTP sea correcto
3. **Backend valida** que el usuario exista antes de dar acceso
4. **SMS rate limiting** de Firebase previene abuso

### ⚠️ Diferencia entre modos:

| Modo           | SMS para usuarios nuevos | SMS para usuarios registrados | Métricas    |
| -------------- | ------------------------ | ----------------------------- | ----------- |
| **Monitoring** | ✅ Permite               | ✅ Permite                    | ✅ Recopila |
| **Enforce**    | ❌ Bloquea (Error 39)    | ✅ Permite                    | ✅ Recopila |

**Recomendación**: Usa "Monitoring" hasta que tengas una base grande de usuarios registrados. Luego puedes activar "Enforce" si lo deseas.

---

## 🎯 Solución Alternativa: Permitir Registro Durante Login

Si prefieres mantener App Check en "Enforce", puedes modificar el flujo de login para crear el usuario en Firebase Authentication automáticamente:

### Modificación en `phone-login.page.ts`:

```typescript
// En el método loginOrRegisterWithBackend(), línea ~259
private async loginOrRegisterWithBackend(firebaseToken: string) {
  // Primero intentar login
  this.authService
    .loginWithPhone({ phone: this.fullPhoneNumber, firebaseToken })
    .subscribe({
      next: async (response) => {
        // ✅ Usuario existe, login exitoso
        this.router.navigate(['/tabs'], { replaceUrl: true });
      },
      error: async (error) => {
        // Usuario no existe
        if (error.status === 401 || error.status === 404) {
          // 🆕 En lugar de solo mostrar diálogo,
          // Firebase YA creó el usuario en Authentication durante verifyOTP()
          // Ahora solo falta crearlo en tu BD
          await this.showRegistrationDialog(firebaseToken);
        } else {
          // Otro error
          const alert = await this.alertController.create({
            header: 'Error',
            message: error.error?.message || 'Error al iniciar sesión',
            buttons: ['OK'],
          });
          await alert.present();
        }
      },
    });
}
```

**Nota**: Esta modificación NO es necesaria si usas "Monitoring". El código actual ya funciona correctamente.

---

## 📊 Checklist de Verificación

### Antes de probar:

- [ ] App Check configurado en Firebase Console
- [ ] Modo: **"Monitoring"** (no "Enforce")
- [ ] Play Integrity API vinculada en Play Console
- [ ] Huellas SHA agregadas en Firebase
- [ ] App instalada desde Play Store

### Prueba 1: Usuario NO registrado

- [ ] Ir a Phone Login (sin registrarse antes)
- [ ] Ingresar teléfono nuevo: `+51999888777`
- [ ] ✅ SMS llega correctamente
- [ ] Verificar código
- [ ] ✅ Mensaje: "Usuario no encontrado, ¿deseas registrarte?"
- [ ] Completar registro
- [ ] ✅ Login exitoso

### Prueba 2: Usuario registrado

- [ ] Cerrar sesión
- [ ] Ir a Phone Login
- [ ] Ingresar el mismo teléfono: `+51999888777`
- [ ] ✅ SMS llega correctamente
- [ ] Verificar código
- [ ] ✅ Login exitoso directo

---

## 🔧 Troubleshooting

### Error 39 sigue apareciendo después de cambiar a "Monitoring"

**Posibles causas**:

1. **Propagación pendiente** (esperar 5-10 minutos)
2. **Cache de Firebase** en la app:

   ```powershell
   # Desinstalar completamente
   adb uninstall com.deliverygofast1.app
   # Reinstalar desde Play
   ```

3. **App Check no está registrado**:

   - Firebase Console → App Check → Apps
   - Verificar que `com.deliverygofast1.app` esté como "Registered"

4. **App instalada por USB** (no desde Play):
   ```powershell
   adb shell dumpsys package com.deliverygofast1.app | findstr installerPackageName
   # Debe mostrar: installerPackageName=com.android.vending
   ```

### Verificar estado actual de App Check

```powershell
# Capturar logs mientras reproduces el error
adb logcat -c
adb logcat | findstr /i "AppCheck|PlayIntegrity|FirebaseAuth"
```

Busca en los logs:

- ✅ `App Check token obtained successfully` → Monitoring activo
- ❌ `App Check token rejected` → Enforce activo (cambiar a Monitoring)
- ❌ `Play Integrity attestation failed` → Verificar vinculación

---

## ✅ Resumen Ejecutivo

**Problema**: Error 39 al enviar OTP para usuarios NO registrados.

**Causa**: App Check en modo "Enforce" bloquea solicitudes de usuarios nuevos.

**Solución**:

1. ✅ Firebase Console → App Check → **"Monitoring"**
2. ✅ Esperar 5 minutos
3. ✅ Desinstalar e instalar app desde Play
4. ✅ Probar Phone Login sin registro previo

**Resultado esperado**:

- ✅ SMS llega a usuarios nuevos
- ✅ Backend valida y pide registro
- ✅ Flujo completo funciona

**Tiempo**: 10 minutos (incluye propagación).

---

## 📚 Referencias

- [Firebase App Check - Monitoring vs Enforce](https://firebase.google.com/docs/app-check/android/default-providers#project-setup)
- [Play Integrity API](https://developer.android.com/google/play/integrity)
- [Firebase Phone Auth Troubleshooting](https://firebase.google.com/docs/auth/android/phone-auth#troubleshooting)

---

## 🆘 Soporte Adicional

Si después de cambiar a "Monitoring" el error persiste:

1. Captura pantalla de:

   - Firebase Console → App Check → Estado de enforcement
   - Logs completos del error (adb logcat)

2. Verifica:

   ```powershell
   # ¿App instalada desde Play?
   adb shell dumpsys package com.deliverygofast1.app | findstr installerPackageName

   # ¿Qué versión está instalada?
   adb shell dumpsys package com.deliverygofast1.app | findstr versionCode
   ```

3. Comparte los resultados para diagnóstico detallado.
