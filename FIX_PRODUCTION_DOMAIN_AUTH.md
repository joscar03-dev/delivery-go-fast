# 🌐 Configuración de Dominio de Producción para Firebase Auth

## 🔍 Problema: Error auth/error-code:-39 en producción

Si ves este error cuando accedes desde `https://www.gofastdelivery.site`:

```
POST https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode 503 (Service Unavailable)
FirebaseError: Firebase: Error (auth/error-code:-39)
```

**Causa:** El dominio de producción no está autorizado en Firebase Console.

---

## ✅ SOLUCIÓN: Agregar dominio de producción

### **Paso 1: Authorized Domains en Firebase**

1. **Ve a:** https://console.firebase.google.com/project/delivery-go-fast/authentication/settings

2. Scroll hasta **"Authorized domains"**

3. Verifica que tengas estos dominios:

   - ✅ `localhost` (para desarrollo)
   - ✅ `delivery-go-fast.firebaseapp.com` (dominio de Firebase)
   - ✅ `gofastdelivery.site` (tu dominio de producción)
   - ✅ `www.gofastdelivery.site` (con www)

4. Si faltan, agrégalos:
   - Click en **"Add domain"**
   - Escribe: `gofastdelivery.site`
   - Click en **"Add"**
   - Repite para: `www.gofastdelivery.site`

---

### **Paso 2: Dominios en reCAPTCHA**

1. **Ve a:** https://console.cloud.google.com/security/recaptcha?project=delivery-go-fast

2. Click en el **nombre de tu clave reCAPTCHA** (la que creaste antes)

3. En la sección **"Dominios"**, asegúrate de tener:

   ```
   localhost
   127.0.0.1
   delivery-go-fast.firebaseapp.com
   gofastdelivery.site
   www.gofastdelivery.site
   ```

4. Si faltan, agrégalos uno por uno

5. Click en **"GUARDAR"**

---

### **Paso 3: Verificar certificado SSL**

Asegúrate de que tu dominio tenga **HTTPS** activo:

- ✅ `https://www.gofastdelivery.site` (con SSL)
- ❌ `http://www.gofastdelivery.site` (sin SSL - NO funcionará)

Firebase requiere HTTPS en producción para Phone Authentication.

---

## 🧪 Prueba después de configurar

### 1. Limpiar caché del navegador

```
Ctrl + Shift + Delete
Seleccionar "Cached images and files"
Click en "Clear data"
```

### 2. Recargar la página

```
Ctrl + Shift + R (recarga forzada)
```

### 3. Intentar enviar OTP

- Ve a: `https://www.gofastdelivery.site/phone-login`
- Ingresa un número de teléfono
- Click en "Enviar código"
- Deberías ver el reCAPTCHA y luego recibir el SMS

---

## 📋 Checklist de dominios

### Firebase Console - Authorized Domains

- [ ] `localhost`
- [ ] `delivery-go-fast.firebaseapp.com`
- [ ] `gofastdelivery.site`
- [ ] `www.gofastdelivery.site`

### Google Cloud - reCAPTCHA Domains

- [ ] `localhost`
- [ ] `127.0.0.1`
- [ ] `delivery-go-fast.firebaseapp.com`
- [ ] `gofastdelivery.site`
- [ ] `www.gofastdelivery.site`

### SSL/HTTPS

- [ ] Certificado SSL activo
- [ ] Redirección HTTP → HTTPS configurada

---

## 🚀 Para desarrollo vs producción

### Desarrollo (localhost)

```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: "http://localhost:3000",
  firebase: {
    apiKey: "AIzaSyBVtu1KlEiA8HxPCoT9pSUIE3Pm2oBE2xA",
    authDomain: "delivery-go-fast.firebaseapp.com",
    // ...
  },
};
```

### Producción (gofastdelivery.site)

```typescript
// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: "https://api.gofastdelivery.site", // ← Cambiar a tu API de producción
  firebase: {
    apiKey: "AIzaSyBVtu1KlEiA8HxPCoT9pSUIE3Pm2oBE2xA",
    authDomain: "delivery-go-fast.firebaseapp.com",
    // ...
  },
};
```

---

## 🔥 Errores comunes y soluciones

### Error: `auth/error-code:-39`

**Causa:** Dominio no autorizado  
**Solución:** Agregar dominio en Firebase Authorized Domains y reCAPTCHA

### Error: `503 Service Unavailable`

**Causa:** Servicios de Firebase temporalmente no disponibles o dominio bloqueado  
**Solución:**

1. Verificar dominios autorizados
2. Esperar 5-10 minutos e intentar de nuevo
3. Revisar estado de Firebase: https://status.firebase.google.com

### Error: `Mixed Content` (HTTP/HTTPS)

**Causa:** Intentando cargar recursos HTTP desde una página HTTPS  
**Solución:** Asegurarse de que TODOS los recursos usen HTTPS en producción

### Error: `auth/too-many-requests`

**Causa:** Demasiados intentos de envío de SMS  
**Solución:**

1. Esperar 1-2 horas
2. Usar números de prueba para testing
3. Configurar test phone numbers en Firebase Console

---

## 📞 URLs de configuración rápida

1. **Firebase Authorized Domains:**  
   https://console.firebase.google.com/project/delivery-go-fast/authentication/settings

2. **Google Cloud reCAPTCHA:**  
   https://console.cloud.google.com/security/recaptcha?project=delivery-go-fast

3. **Firebase Project Settings:**  
   https://console.firebase.google.com/project/delivery-go-fast/settings/general

4. **Google Cloud API Key:**  
   https://console.cloud.google.com/apis/credentials?project=delivery-go-fast

---

## 💡 Recomendación: Números de prueba para desarrollo

Para evitar límites de SMS durante desarrollo:

1. Ve a: https://console.firebase.google.com/project/delivery-go-fast/authentication/providers
2. Click en "Phone"
3. Agrega números de prueba:
   - `+51900000001` → `123456`
   - `+51900000002` → `123456`
   - Tu número real → `123456`

**Ventaja:** No consume SMS y no tiene límites.

---

**¡Con estos pasos tu autenticación por teléfono debería funcionar en producción!** 🚀
