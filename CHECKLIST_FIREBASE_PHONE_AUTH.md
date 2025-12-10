# ✅ CHECKLIST RÁPIDO - Phone Authentication Firebase

## Mientras descargas google-services.json, verifica estos puntos:

### 1. Phone Sign-in Method Habilitado

- [ ] Ve a: https://console.firebase.google.com/project/delivery-go-fast/authentication/providers
- [ ] Verifica que "Phone" esté con estado **"Enabled"** (verde)
- [ ] Si está deshabilitado → Click en Phone → Enable → Save

### 2. Números de Prueba (Opcional pero útil)

- [ ] En la misma página, scroll abajo hasta "Phone numbers for testing"
- [ ] Agrega: `+51999999999` con código: `123456`
- [ ] Esto te permite probar sin gastar SMS reales

### 3. SHA Fingerprints (Ya lo tienes pero verifica)

- [ ] Ve a: https://console.firebase.google.com/project/delivery-go-fast/settings/general
- [ ] Busca tu app Android: `com.deliverygofast1.app`
- [ ] Verifica que veas 4 SHA fingerprints:
  - [ ] SHA-1 (Debug): 96:0E:46:EC:BC:28:...
  - [ ] SHA-256 (Debug): 9A:C7:C2:C8:F6:...
  - [ ] SHA-1 (Release): [De Google Play Console]
  - [ ] SHA-256 (Release): [De Google Play Console]

### 4. Dominios Autorizados

- [ ] Ve a: https://console.firebase.google.com/project/delivery-go-fast/authentication/settings
- [ ] Tab "Authorized domains"
- [ ] Debe incluir:
  - [ ] localhost (para desarrollo)
  - [ ] \*.firebaseapp.com (auto-incluido)
  - [ ] Tu dominio de producción (si tienes)

---

## 📝 Marca con X los que verificaste

Ejemplo:

- [x] Phone habilitado
- [x] 4 SHA fingerprints presentes
- [ ] Dominios autorizados (pendiente)

---

Cuando termines de verificar, pega aquí tu checklist y continuamos 🚀
