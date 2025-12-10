# 🔐 VERIFICACIÓN COMPLETA DE SHA FINGERPRINTS

## 📱 SHA Fingerprints Actuales

### ✅ DEBUG KEYSTORE (Desarrollo Local)

Obtenidos de: `%USERPROFILE%\.android\debug.keystore`

```
SHA-1 (Debug):
96:0E:46:EC:BC:28:A0:2A:18:BC:A2:76:49:07:E6:1A:60:C8:34:F4

SHA-256 (Debug):
9A:C7:C2:C8:F6:C4:F2:BC:DD:01:AA:68:19:F3:57:A7:FC:9D:D0:F8:7C:7A:67:81:66:21:23:6B:49:A6:19:35
```

### ✅ RELEASE KEYSTORE (Producción - Google Play Console)

**Por favor, copia y pega aquí los SHA de producción:**

```
SHA-1 (Release/Producción):
[PEGA AQUÍ EL SHA-1 DE GOOGLE PLAY CONSOLE]

SHA-256 (Release/Producción):
[PEGA AQUÍ EL SHA-256 DE GOOGLE PLAY CONSOLE]
```

---

## 🎯 CHECKLIST DE VERIFICACIÓN

### En Firebase Console

Ve a: https://console.firebase.google.com/project/delivery-go-fast/settings/general

Verifica que en **"SHA certificate fingerprints"** estén estos 4:

- [ ] SHA-1 (Debug): `96:0E:46:EC:BC:28:A0:2A:18:BC:A2:76:49:07:E6:1A:60:C8:34:F4`
- [ ] SHA-256 (Debug): `9A:C7:C2:C8:F6:C4:F2:BC:DD:01:AA:68:19:F3:57:A7:FC:9D:D0:F8:7C:7A:67:81:66:21:23:6B:49:A6:19:35`
- [ ] SHA-1 (Release): `[TU SHA-1 DE PRODUCCIÓN]`
- [ ] SHA-256 (Release): `[TU SHA-256 DE PRODUCCIÓN]`

---

## 🔍 CÓMO OBTENER SHA DE GOOGLE PLAY CONSOLE

Si aún no los tienes a mano:

1. Ve a: https://play.google.com/console
2. Selecciona tu app: **Delivery Go Fast**
3. Menú lateral → **Configuración** → **Integridad de la app**
4. Busca sección **"Certificado de firma de la app"**
5. Verás:
   - **SHA-1 certificate fingerprint**
   - **SHA-256 certificate fingerprint**
6. Cópialos

---

## ⚠️ IMPORTANTE: ¿Están TODOS en Firebase?

Firebase necesita **LOS 4** para que funcione correctamente:

### ✅ Con Debug SHA:

- Funciona en desarrollo (Android Studio)
- Funciona en emulador
- Funciona en dispositivo físico con USB debug

### ✅ Con Release SHA:

- Funciona en versión de producción
- Funciona en app descargada desde Play Store
- Funciona en Internal Testing / Beta

### ❌ Sin alguno de ellos:

- Phone Authentication falla con error: `auth/app-not-authorized`
- SMS no se envía
- Firebase rechaza la solicitud

---

## 🚀 PRÓXIMO PASO

**OPCIÓN 1: Si ya están todos en Firebase Console**
→ Descarga nuevo `google-services.json` y actualiza el proyecto

**OPCIÓN 2: Si faltan algunos**
→ Agrégalos ahora en Firebase Console

**OPCIÓN 3: Si no estás seguro**
→ Dame un screenshot de la sección SHA en Firebase Console y te ayudo a verificar

---

¿Qué opción aplica a tu caso? 🤔
