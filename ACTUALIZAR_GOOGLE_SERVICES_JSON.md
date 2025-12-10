# 🔄 ACTUALIZAR google-services.json - GUÍA RÁPIDA

**Fecha**: 19 de noviembre de 2025  
**Razón**: SHA de producción agregados ayer en Firebase Console

---

## ⚠️ PROBLEMA IDENTIFICADO

```
Situación:
├── SHA de debug agregados hace días ✅
├── SHA de producción agregados AYER ✅
└── google-services.json descargado ANTES de ayer ❌ ← ESTE ES EL PROBLEMA
```

El archivo `google-services.json` actual NO incluye los SHA de producción.

---

## 🚀 SOLUCIÓN - PASO A PASO

### 1️⃣ Descargar nuevo google-services.json (2 min)

1. Ve a: https://console.firebase.google.com/project/delivery-go-fast/settings/general

2. Scroll abajo hasta **"Your apps"**

3. Busca la app **Android**: `com.deliverygofast1.app`

4. Click en el ícono de **engranaje ⚙️** (o los tres puntos)

5. Busca el botón **"google-services.json"** y click en **"Download"** o **"Descargar"**

6. Guarda el archivo (por defecto va a Descargas)

---

### 2️⃣ Backup del archivo actual (opcional pero recomendado)

```powershell
# En PowerShell, copia el archivo actual como respaldo
cd C:\laragon\www\delivery-go-fast\delivery-frontend\android\app
Copy-Item google-services.json google-services.json.backup
```

---

### 3️⃣ Reemplazar el archivo

Copia el nuevo `google-services.json` desde Descargas a:

```
C:\laragon\www\delivery-go-fast\delivery-frontend\android\app\google-services.json
```

**Reemplaza el archivo existente**

---

### 4️⃣ Verificar el contenido del nuevo archivo

```powershell
# Verificar que el project_id sea correcto
cd C:\laragon\www\delivery-go-fast\delivery-frontend
Select-String -Path "android\app\google-services.json" -Pattern "project_id"
```

Debe mostrar:

```json
"project_id": "delivery-go-fast"
```

---

### 5️⃣ Sincronizar con Capacitor

```powershell
cd C:\laragon\www\delivery-go-fast\delivery-frontend
npx cap sync android
```

---

### 6️⃣ Limpiar y Rebuild en Android Studio

```powershell
# Abrir Android Studio
npx cap open android
```

Luego en Android Studio:

1. **Build** → **Clean Project** (esperar a que termine)
2. **Build** → **Rebuild Project** (esperar a que termine)
3. **Run** → Ejecutar en dispositivo/emulador

---

## ✅ VERIFICACIÓN

Después de seguir estos pasos, prueba Phone Authentication:

1. Abre la app
2. Ve a Phone Login
3. Ingresa un número real: `+51987654321`
4. Verifica que **LLEGUE EL SMS** 📱
5. Ingresa el código OTP
6. Verifica que **LOGIN FUNCIONE** ✅

---

## 🐛 Si aún no funciona después de esto

Entonces el problema es otro. Verifica:

1. **Phone Authentication habilitado en Firebase**:

   - Firebase Console → Authentication → Sign-in method
   - "Phone" debe estar en estado **"Enabled"**

2. **Dominios autorizados** (para PWA/Web):

   - Firebase Console → Authentication → Settings → Authorized domains
   - Debe incluir: `localhost`, tu dominio

3. **Logs de la app**:
   - Abre Chrome DevTools (si es web) o Logcat (si es Android)
   - Busca errores con la palabra "Firebase" o "auth"

---

## 📝 NOTAS

- ✅ Este proceso NO afecta a usuarios existentes
- ✅ NO necesitas republicar en Play Store
- ✅ Los tokens actuales siguen funcionando
- ⚠️ Debes hacer esto CADA VEZ que cambies SHA en Firebase Console
- ⚠️ Este archivo NO debe subirse a Git (ya está en .gitignore)

---

## 🎯 RESUMEN

```
ANTES (Ayer):
└── google-services.json (con solo SHA de debug)

HOY (Agregaste SHA de producción):
└── Firebase Console actualizado ✅
└── google-services.json desactualizado ❌

DESPUÉS (Tras seguir esta guía):
└── google-services.json actualizado con TODOS los SHA ✅
```

---

¿Listo para hacerlo? Te guío paso a paso si necesitas ayuda 🚀
