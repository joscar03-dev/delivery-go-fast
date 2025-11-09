# 🔥 Guía Completa: Configurar Firebase Console para Phone Auth

## ⏱️ Tiempo estimado: 10-15 minutos

---

## 📋 Checklist

- [ ] **Paso 1**: Obtener credenciales Web SDK
- [ ] **Paso 2**: Actualizar `environment.ts`
- [ ] **Paso 3**: Habilitar Phone Authentication
- [ ] **Paso 4**: Configurar dominios autorizados
- [ ] **Paso 5**: (Opcional) Agregar números de prueba
- [ ] **Paso 6**: Verificar configuración

---

## 🚀 Paso 1: Obtener Credenciales Web SDK

### 1.1 Acceder a Firebase Console

1. Abre tu navegador
2. Ve a: https://console.firebase.google.com/
3. Inicia sesión con tu cuenta de Google
4. Selecciona el proyecto: **delivery-go-fast**

### 1.2 Ir a Project Settings

1. En el menú lateral izquierdo, haz clic en el ícono del **engranaje ⚙️**
2. Selecciona **"Project settings"** (Configuración del proyecto)

### 1.3 Buscar App Web

1. En la página de configuración, desplázate hacia abajo
2. Busca la sección **"Your apps"** (Tus aplicaciones)
3. Busca si hay una app con el ícono `</>`

### 1.4 Crear App Web (si no existe)

**Si NO ves ninguna app web:**

1. Haz clic en el botón con el ícono **`</>`** (Web)
2. Te pedirá un nombre:
   ```
   App nickname: Delivery Go Fast Web
   ```
3. **NO** marques la casilla "Also set up Firebase Hosting"
4. Haz clic en **"Register app"**
5. Espera a que se cree (unos segundos)

**Si YA existe una app web:**

1. Haz clic en la app web existente
2. Verás la configuración directamente

### 1.5 Copiar Configuración

Verás un código JavaScript como este:

```javascript
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQ",
  authDomain: "delivery-go-fast.firebaseapp.com",
  projectId: "delivery-go-fast",
  storageBucket: "delivery-go-fast.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef",
};
```

**Copia estos valores** (los necesitarás en el siguiente paso):

- ✏️ `apiKey`
- ✏️ `authDomain`
- ✏️ `projectId` (ya debe ser "delivery-go-fast")
- ✏️ `storageBucket`
- ✏️ `messagingSenderId`
- ✏️ `appId`

---

## 📝 Paso 2: Actualizar environment.ts

### 2.1 Abrir archivo de configuración

En VS Code, abre:

```
delivery-frontend/src/environments/environment.ts
```

### 2.2 Reemplazar valores

Busca la sección `firebase:` y reemplaza los valores:

**ANTES (valores placeholder):**

```typescript
firebase: {
  apiKey: 'AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', // TODO
  authDomain: 'delivery-go-fast.firebaseapp.com',
  projectId: 'delivery-go-fast',
  storageBucket: 'delivery-go-fast.appspot.com',
  messagingSenderId: '000000000000', // TODO
  appId: '1:000000000000:web:xxxxxxxxxxxxxxxx', // TODO
}
```

**DESPUÉS (tus valores reales de Firebase Console):**

```typescript
firebase: {
  apiKey: 'AIzaSyAaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQ', // ✅ Tu valor real
  authDomain: 'delivery-go-fast.firebaseapp.com', // ✅ Ya correcto
  projectId: 'delivery-go-fast', // ✅ Ya correcto
  storageBucket: 'delivery-go-fast.appspot.com', // ✅ Ya correcto
  messagingSenderId: '123456789012', // ✅ Tu valor real
  appId: '1:123456789012:web:abcdef1234567890abcdef', // ✅ Tu valor real
}
```

### 2.3 Actualizar environment.prod.ts

También actualiza el archivo de producción:

```
delivery-frontend/src/environments/environment.prod.ts
```

Reemplaza la sección `firebase:` con los **mismos valores**.

### 2.4 Guardar archivos

- Guarda ambos archivos (`Ctrl + S`)
- ✅ Configuración del frontend completada

---

## 🔓 Paso 3: Habilitar Phone Authentication

### 3.1 Ir a Authentication

1. En Firebase Console, menú lateral izquierdo
2. Haz clic en **"Build"** (Crear)
3. Selecciona **"Authentication"**

### 3.2 Ir a Sign-in method

1. En la pestaña superior, haz clic en **"Sign-in method"**
2. Verás una lista de métodos de autenticación

### 3.3 Habilitar Phone

1. Busca en la lista: **"Phone"**
2. Haz clic en la fila **"Phone"**
3. Se abrirá un modal
4. Activa el toggle **"Enable"** (mover a la derecha)
5. Verás que el estado cambia a **"Enabled"**
6. Haz clic en **"Save"** (Guardar)

### 3.4 Verificar reCAPTCHA

- Firebase configurará automáticamente reCAPTCHA
- No necesitas hacer nada adicional
- reCAPTCHA v3 (invisible) se usará automáticamente

✅ **Phone Authentication habilitada**

---

## 🌐 Paso 4: Configurar Dominios Autorizados

### 4.1 Ir a Settings

1. Dentro de **"Authentication"**
2. Haz clic en la pestaña **"Settings"** (arriba)
3. Desplázate hasta la sección **"Authorized domains"**

### 4.2 Verificar dominios por defecto

Deberías ver estos dominios ya autorizados:

- ✅ `localhost` (para desarrollo)
- ✅ `delivery-go-fast.firebaseapp.com` (hosting de Firebase)

### 4.3 Agregar dominio de producción

1. Haz clic en **"Add domain"**
2. Ingresa: `gofastdelivery.site`
3. Haz clic en **"Add"**

**Si tienes otros dominios** (www, subdominios):

```
gofastdelivery.site
www.gofastdelivery.site
api.gofastdelivery.site (si usas)
```

✅ **Dominios configurados**

---

## 🧪 Paso 5: Agregar Números de Prueba (Opcional pero Recomendado)

### ¿Por qué números de prueba?

- ✅ No envían SMS reales
- ✅ No consumen cuota de Firebase
- ✅ Siempre aceptan el mismo código
- ✅ Perfectos para desarrollo y testing

### 5.1 Configurar números de prueba

1. En **"Authentication"** → **"Sign-in method"**
2. Haz clic en **"Phone"**
3. Desplázate hasta **"Phone numbers for testing"**
4. Haz clic en **"Add phone number"**

### 5.2 Agregar números

**Ejemplo 1 - Perú:**

```
Phone number: +51999999999
Verification code: 123456
```

**Ejemplo 2 - Perú (alternativo):**

```
Phone number: +51888888888
Verification code: 654321
```

**Ejemplo 3 - USA (si necesitas):**

```
Phone number: +11234567890
Verification code: 111111
```

### 5.3 Guardar

- Haz clic en **"Add"** después de cada número
- Puedes agregar hasta 10 números de prueba

### 5.4 Usar números de prueba

En tu app:

1. Ingresa el número de prueba: `+51999999999`
2. Haz clic en "Enviar código"
3. **NO recibirás SMS real**
4. Ingresa el código configurado: `123456`
5. ✅ Verificación exitosa sin SMS

✅ **Números de prueba configurados**

---

## ✅ Paso 6: Verificar Configuración

### 6.1 Checklist Final

Verifica que todo esté configurado:

**En Firebase Console:**

- [ ] ✅ App Web creada con credenciales
- [ ] ✅ Phone Authentication habilitada (toggle en verde)
- [ ] ✅ `localhost` en dominios autorizados
- [ ] ✅ `gofastdelivery.site` en dominios autorizados
- [ ] ✅ (Opcional) Números de prueba agregados

**En tu código:**

- [ ] ✅ `environment.ts` actualizado con credenciales reales
- [ ] ✅ `environment.prod.ts` actualizado con credenciales reales
- [ ] ✅ Archivos guardados

### 6.2 Probar la configuración

#### Opción A: Con número de prueba (sin SMS)

1. Inicia el frontend:

   ```bash
   cd delivery-frontend
   npm start
   ```

2. Abre: http://localhost:8100/auth/login

3. Clic en **"Iniciar con Teléfono"**

4. Ingresa número de prueba: `+51999999999`

5. Clic **"Enviar código"**

6. **Esperado:**

   - ✅ reCAPTCHA se resuelve (invisible)
   - ✅ Cambia al paso de OTP
   - ✅ **NO llega SMS** (es número de prueba)
   - ✅ Timer de 60s inicia

7. Ingresa código: `123456`

8. Clic **"Verificar código"**

9. **Esperado:**
   - ✅ Código aceptado
   - ✅ Si usuario no existe → Diálogo de registro
   - ✅ Si existe → Login exitoso → Navega a /tabs

#### Opción B: Con número real (envía SMS)

1. Usa tu número real de teléfono (ej: `+51987654321`)
2. Haz clic en "Enviar código"
3. **Recibirás SMS real** en tu teléfono
4. Ingresa el código de 6 dígitos recibido
5. Verifica el flujo completo

### 6.3 Verificar en Firebase Console

Después de hacer pruebas:

1. Firebase Console → **Authentication** → **Users**
2. Deberías ver:
   - Usuarios registrados con teléfono
   - Columna "Sign-in provider": **Phone**
   - Número de teléfono visible

---

## 🔍 Troubleshooting

### Problema: "Firebase: Error (auth/invalid-api-key)"

**Causa**: `apiKey` incorrecto en `environment.ts`

**Solución**:

1. Verifica que copiaste correctamente el `apiKey` de Firebase Console
2. No debe tener espacios ni comillas extras
3. Reinicia el servidor de desarrollo: `npm start`

### Problema: "Firebase: Error (auth/unauthorized-domain)"

**Causa**: Dominio no autorizado en Firebase Console

**Solución**:

1. Firebase Console → Authentication → Settings → Authorized domains
2. Verifica que `localhost` esté en la lista
3. Si usas otro puerto (ej: `localhost:8100`), Firebase lo acepta automáticamente con `localhost`

### Problema: "reCAPTCHA verification failed"

**Causa**: Problemas con reCAPTCHA

**Solución**:

1. Recarga la página completamente (`Ctrl + Shift + R`)
2. Verifica que el div `#recaptcha-container` existe en el HTML
3. Abre la consola del navegador (`F12`) y busca errores

### Problema: "SMS not received"

**Causa**: Puede ser cuota excedida, número inválido, o carrier bloqueando

**Solución**:

1. Verifica el formato E.164: `+[código país][número]` (ej: `+51987654321`)
2. Verifica que el número es válido y puede recibir SMS
3. Revisa la cuota de SMS en Firebase Console → Usage
4. Usa números de prueba para desarrollo

### Problema: "auth/too-many-requests"

**Causa**: Demasiados intentos desde la misma IP

**Solución**:

1. Espera 5-10 minutos
2. Usa números de prueba para testing intensivo
3. Firebase tiene rate limiting para prevenir abuso

---

## 📊 Resumen de Configuración

### Valores a copiar de Firebase:

```typescript
// De Firebase Console → Project Settings → Your apps → Web
{
  apiKey: "AIzaSy...",              // ← Copiar de Firebase
  authDomain: "...firebaseapp.com",  // ← Copiar de Firebase
  projectId: "delivery-go-fast",     // ← Ya correcto
  storageBucket: "...appspot.com",   // ← Copiar de Firebase
  messagingSenderId: "123...",       // ← Copiar de Firebase
  appId: "1:123...web:abc"           // ← Copiar de Firebase
}
```

### Archivos a actualizar:

1. `delivery-frontend/src/environments/environment.ts`
2. `delivery-frontend/src/environments/environment.prod.ts`

### Configuración en Firebase Console:

1. ✅ Phone Authentication → **Enabled**
2. ✅ Authorized domains → `localhost`, `gofastdelivery.site`
3. ✅ (Opcional) Phone numbers for testing → `+51999999999` con código `123456`

---

## 🎯 Siguiente Paso

Una vez completada esta configuración:

1. ✅ El frontend estará 100% funcional
2. ✅ Podrás probar el flujo completo de Phone Login
3. ✅ El backend ya está listo y esperando

**Siguiente tarea**: Implementar campo phone en perfil (Tarea 14)

---

## 📞 Verificación Final

Cuando todo esté configurado, deberías poder:

1. ✅ Abrir http://localhost:8100/auth/login
2. ✅ Ver botón "Iniciar con Teléfono"
3. ✅ Hacer clic y navegar a /phone-login
4. ✅ Ingresar número de teléfono
5. ✅ Recibir SMS (o usar número de prueba)
6. ✅ Ingresar código OTP
7. ✅ Hacer login o registrarse exitosamente
8. ✅ Navegar a /tabs con sesión iniciada

---

**Última actualización**: 8 de noviembre de 2025  
**Tiempo estimado**: 10-15 minutos  
**Dificultad**: ⭐⭐☆☆☆ (Fácil)
