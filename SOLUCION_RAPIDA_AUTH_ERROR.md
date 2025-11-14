# ⚡ SOLUCIÓN RÁPIDA: auth/invalid-app-credential

## 🎯 PASOS OBLIGATORIOS (Haz estos 4 pasos):

### ✅ PASO 1: Autorizar localhost en Firebase Console (CRÍTICO)

**URL directa:** https://console.firebase.google.com/project/delivery-go-fast/authentication/settings

1. Scroll hasta la sección **"Authorized domains"**
2. Verifica que `localhost` esté en la lista
3. Si NO está, click en **"Add domain"**
4. Escribe: `localhost`
5. Click en **"Add"**

---

### ✅ PASO 2: Quitar restricciones de API Key (CRÍTICO)

**URL directa:** https://console.cloud.google.com/apis/credentials?project=delivery-go-fast

1. Busca en la lista: API Key `AIzaSyBVtu1KlEiA8HxPCoT9pSUIE3Pm2oBE2xA`
2. Click en el **ícono de lápiz** (editar)
3. En **"Application restrictions"**:
   - Selecciona: ⭕ **None**
4. En **"API restrictions"**:
   - Selecciona: ⭕ **Don't restrict key**
5. Click en **"SAVE"** (abajo a la derecha)

---

### ✅ PASO 3: Configurar reCAPTCHA (MUY IMPORTANTE)

**URL directa:** https://console.cloud.google.com/security/recaptcha?project=delivery-go-fast

#### Opción A: Si ya tienes una clave reCAPTCHA

1. Click en el **nombre de la clave** existente
2. En la sección **"Dominios"**, asegúrate de tener:
   - `localhost` ✅
   - `127.0.0.1` ✅
   - `delivery-go-fast.firebaseapp.com` ✅
3. Si falta alguno, agrégalo
4. Click en **"GUARDAR"**

#### Opción B: Si NO tienes una clave reCAPTCHA

1. Click en **"+ CREAR CLAVE"**
2. **Etiqueta**: `delivery-go-fast-recaptcha`
3. **Tipo de reCAPTCHA**: Selecciona **reCAPTCHA v2** → "Casilla de verificación 'No soy un robot'"
4. **Dominios**: Agrega estos 3 dominios (uno por línea):
   ```
   localhost
   127.0.0.1
   delivery-go-fast.firebaseapp.com
   ```
5. Click en **"ENVIAR"**

---

### ✅ PASO 4: Verificar Identity Toolkit API

**URL directa:** https://console.cloud.google.com/apis/library/identitytoolkit.googleapis.com?project=delivery-go-fast

1. Verifica que diga: **"API ENABLED"** ✅
2. Si dice **"ENABLE"**, haz click en el botón para habilitarla
3. Espera unos segundos a que se active

---

## 🧪 VERIFICACIÓN

Después de hacer estos 4 pasos:

### 1. Reinicia tu servidor de desarrollo

```bash
# Detén el servidor (Ctrl + C)
# Vuelve a iniciarlo
ionic serve
```

### 2. Abre la consola del navegador

1. Ve a: `http://localhost:8100/phone-login`
2. Presiona **F12** para abrir DevTools
3. Ve a la pestaña **Console**
4. Deberías ver el diagnóstico automático:

```
🔍 === FIREBASE DIAGNOSTICS ===
📋 6. Firebase API Connectivity:
  ✓ Identity Toolkit API status: 200
  ✅ API Key is valid and has access to Identity Toolkit
```

### 3. Prueba enviar OTP

1. Ingresa tu número: `+51927885314`
2. Click en **"Enviar código"**
3. **Resultado esperado:**

   - ✅ Se muestra el reCAPTCHA
   - ✅ Después de resolver, dice "Código enviado"
   - ✅ Recibes SMS en tu teléfono

4. **Si sigue fallando**, revisa la consola:
   - Si dice `status: 403` → La API Key aún tiene restricciones (vuelve al PASO 2)
   - Si dice `status: 400` → El dominio no está autorizado (vuelve al PASO 1 y 3)

---

## 🔥 ALTERNATIVA TEMPORAL: Números de Prueba

Si necesitas probar AHORA mientras configuras lo anterior:

**URL:** https://console.firebase.google.com/project/delivery-go-fast/authentication/providers

1. Click en **"Phone"**
2. Scroll hasta **"Phone numbers for testing"**
3. Click en **"Add phone number"**
4. Agrega:
   - **Número de teléfono**: `+51927885314`
   - **Código de prueba**: `123456`
5. Click en **"Add"**

**Cómo usar:**

- Ingresa `+51927885314` en tu app
- Firebase NO enviará SMS real
- Usa el código `123456` para verificar

---

## 📋 Checklist Final

Antes de intentar de nuevo, verifica:

- [ ] ✅ `localhost` está en "Authorized domains" de Firebase Console
- [ ] ✅ API Key NO tiene restricciones (Application restrictions: None)
- [ ] ✅ API Key NO tiene restricciones de API (Don't restrict key)
- [ ] ✅ reCAPTCHA tiene `localhost` en su lista de dominios
- [ ] ✅ Identity Toolkit API está HABILITADA
- [ ] ✅ Reiniciaste el servidor de desarrollo
- [ ] ✅ Limpiaste la caché del navegador (Ctrl + Shift + R)

---

## ❓ Si TODAVÍA falla

Revisa la consola del navegador y busca específicamente:

### Error: `status: 403`

**Causa:** API Key restringida  
**Solución:** Repite el PASO 2, asegúrate de GUARDAR los cambios

### Error: `status: 400` + `invalid-app-credential`

**Causa:** Dominio no autorizado  
**Solución:** Repite el PASO 1 y PASO 3

### Error: `reCAPTCHA container not found`

**Causa:** Falta el div en el HTML  
**Solución:** Verifica que `phone-login.page.html` tenga:

```html
<div id="recaptcha-container"></div>
```

### Error: DNS o red

**Causa:** Problemas de conectividad  
**Solución:** Verifica tu conexión a internet y que puedas acceder a `https://firebase.google.com`

---

## 📞 Resumen de URLs Necesarias

1. **Authorized domains:**  
   https://console.firebase.google.com/project/delivery-go-fast/authentication/settings

2. **API Key:**  
   https://console.cloud.google.com/apis/credentials?project=delivery-go-fast

3. **reCAPTCHA:**  
   https://console.cloud.google.com/security/recaptcha?project=delivery-go-fast

4. **Identity Toolkit API:**  
   https://console.cloud.google.com/apis/library/identitytoolkit.googleapis.com?project=delivery-go-fast

5. **Test phone numbers (opcional):**  
   https://console.firebase.google.com/project/delivery-go-fast/authentication/providers

---

**¡Con estos pasos debería funcionar!** 🚀
