# 🔧 Solución Error 39 - Firebase UI Real (Noviembre 2025)

## 🎯 Tu Situación EXACTA

Estás en: **Firebase Console → Build → App Check → APIs**

Ves:

```
┌──────────────────────────────────────────────────────────┐
│ APIs                                                      │
│                                                           │
│ Firebase Authentication                    ⋮              │
│ Not configured                                            │
│                                                           │
│ Click en ⋮ y ves:                                        │
│   📊 Ver métricas                                        │
│   [Aplicar]  ← Solo este botón                          │
└──────────────────────────────────────────────────────────┘
```

---

## ✅ Solución CORRECTA (Paso a Paso)

### Paso 1: Click en "Aplicar"

1. Click en **⋮** (3 puntitos) de **Firebase Authentication**
2. Menú muestra:
   - 📊 Ver métricas
   - **[Aplicar]** ← Click AQUÍ
3. Se abrirá un panel/diálogo

---

### Paso 2: Configurar en el Panel que se Abre

Después de hacer click en **"Aplicar"**, verás un panel con opciones:

```
┌──────────────────────────────────────────────────────────┐
│ Aplicar App Check a Firebase Authentication             │
│                                                           │
│ Elige cómo aplicar App Check:                           │
│                                                           │
│ ○ No aplicar                                             │
│   Las solicitudes sin tokens válidos se permiten        │
│                                                           │
│ ● Supervisar  ← SELECCIONA ESTA                         │
│   Recopilar métricas pero permitir todas las solicitudes│
│                                                           │
│ ○ Aplicar                                                │
│   Bloquear solicitudes sin tokens válidos de App Check  │
│                                                           │
│ [Cancelar]  [Guardar]  ← Click Guardar                  │
└──────────────────────────────────────────────────────────┘
```

**IMPORTANTE**:

- ✅ Selecciona: **"Supervisar"** (segunda opción)
- ❌ NO selecciones: "Aplicar" (tercera opción)
- ❌ NO selecciones: "No aplicar" (primera opción)

---

### Paso 3: Guardar y Esperar

1. Click **"Guardar"**
2. ⏱️ **Espera 5-10 minutos** para propagación
3. La UI cambiará a:

```
┌──────────────────────────────────────────────────────────┐
│ Firebase Authentication                    ⋮              │
│ Supervisar  ← Ahora debe decir esto                     │
└──────────────────────────────────────────────────────────┘
```

---

## 🔍 Posibles Textos en Español/Inglés

Firebase puede mostrarlo en español o inglés dependiendo de tu configuración:

### Español:

- **Supervisar** = Modo correcto ✅
- Aplicar = Modo estricto ❌
- No aplicar = Desactivado ❌

### Inglés:

- **Monitor** = Modo correcto ✅
- Enforce = Modo estricto ❌
- Off = Desactivado ❌

---

## 🎯 ¿Por Qué "Supervisar" y No "Aplicar"?

```
┌─────────────────────────────────────────────────────────┐
│ Con "Aplicar" (Enforce):                                 │
│                                                          │
│ Usuario NO registrado → Enviar OTP                      │
│                              ↓                           │
│                     Firebase verifica token             │
│                              ↓                           │
│                  🚫 Error 39 (bloqueado)                │
│                  No se envía SMS                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Con "Supervisar" (Monitor):                              │
│                                                          │
│ Usuario NO registrado → Enviar OTP                      │
│                              ↓                           │
│                     Firebase verifica token             │
│                              ↓                           │
│                  ✅ Permite continuar                    │
│                  📨 Envía SMS                            │
│                              ↓                           │
│                  Usuario verifica código                │
│                              ↓                           │
│            Backend: "No estás registrado"               │
│                              ↓                           │
│         Diálogo: "¿Deseas registrarte?"                 │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 Verificar Configuración

### Método 1: Visual en Firebase Console

Después de guardar (espera 5 min), deberías ver:

```
Firebase Authentication          ⋮
Supervisar  ← ✅ Perfecto
```

O en inglés:

```
Firebase Authentication          ⋮
Monitor  ← ✅ Perfect
```

### Método 2: Captura los Logs

Después de instalar la app actualizada:

```powershell
adb logcat -c
adb logcat | findstr /i "AppCheck|enforcement"
```

Busca:

- ✅ `enforcement mode: MONITORING` o `UNENFORCED`
- ❌ `enforcement mode: ENFORCED` (si ves esto, cambiar a Supervisar)

---

## 📱 Siguiente Paso: Compilar y Subir

### 1. Generar AAB (Si no lo has hecho)

```powershell
cd c:\laragon\www\delivery-go-fast\delivery-frontend

# Build
npm run build
npx cap sync android

# Generar AAB
cd android
.\gradlew clean
.\gradlew bundleRelease
```

AAB estará en: `android/app/build/outputs/bundle/release/app-release.aab`

### 2. Subir a Play Console

- Play Console → Prueba interna
- Crear nuevo release
- Subir AAB
- Notas: "Fix Error 39: App Check en modo Supervisar"
- Guardar y lanzar

### 3. Instalar desde Play Store

```powershell
# Desinstalar versión anterior
adb uninstall com.deliverygofast1.app

# Los verificadores deben instalar desde Play Store
# usando el enlace de prueba interna
```

### 4. Probar Phone Login

**Caso A: Usuario NO registrado**

1. Abrir app
2. Ir a Phone Login (sin registrarse)
3. Ingresar: `+51999888777`
4. **Resultado esperado**:
   - ✅ SMS llega (SIN Error 39)
   - ✅ Verificar código
   - ✅ Mensaje: "Usuario no encontrado, ¿deseas registrarte?"

**Caso B: Usuario registrado**

1. Completar registro
2. Cerrar sesión
3. Phone Login con el mismo número
4. **Resultado esperado**:
   - ✅ SMS llega
   - ✅ Login exitoso directo

---

## 🔧 Troubleshooting

### "No veo la opción Supervisar"

**Causa**: Versión del navegador o idioma

- Prueba en modo incógnito: `Ctrl + Shift + N`
- O en otro navegador (Chrome, Firefox, Edge)

### "Guardé 'Supervisar' pero sigue Error 39"

**Verificar 3 cosas**:

1. **¿Esperaste 10 minutos?**

   ```
   La configuración tarda en propagarse
   ```

2. **¿App instalada desde Play?**

   ```powershell
   adb shell dumpsys package com.deliverygofast1.app | findstr installerPackageName
   # Debe mostrar: com.android.vending
   ```

3. **¿Subiste la nueva build?**
   - La app debe tener `MainApplication.java` actualizado
   - VersionCode debe ser mayor (ej: de 4 a 5)

---

## 📊 Resumen de Modos

| Modo en Firebase | Usuarios nuevos | Error 39 | Recomendado         |
| ---------------- | --------------- | -------- | ------------------- |
| **No aplicar**   | ✅ Permite      | ❌ No    | Solo para testing   |
| **Supervisar**   | ✅ Permite      | ❌ No    | ✅ **SÍ (tu caso)** |
| **Aplicar**      | ❌ Bloquea      | ✅ Sí    | Solo apps cerradas  |

---

## ✅ Checklist Final

Antes de probar:

- [ ] Firebase Console → App Check → APIs
- [ ] Firebase Authentication → ⋮ → **Aplicar**
- [ ] Seleccionar: **"Supervisar"** → Guardar
- [ ] Esperar 10 minutos
- [ ] Compilar nueva build con `MainApplication.java` actualizado
- [ ] Subir AAB a Play Console
- [ ] Instalar desde Play Store (no USB)
- [ ] Probar Phone Login sin registro previo
- [ ] ✅ SMS debe llegar sin Error 39

---

## 🆘 Si Necesitas Más Ayuda

Comparte:

1. Captura de pantalla del panel "Aplicar App Check" (las 3 opciones)
2. Resultado de:
   ```powershell
   adb logcat -c
   adb logcat | findstr /i "AppCheck|enforcement" > logs.txt
   ```
3. Estado actual en Firebase Console después de guardar

---

## ✅ Resumen Ejecutivo

**Problema**: Firebase usa botón "Aplicar" en lugar de "Manage enforcement".

**Solución**:

1. ✅ Firebase Console → App Check → APIs
2. ✅ Firebase Authentication → ⋮ → **Aplicar**
3. ✅ Seleccionar: **"Supervisar"** (segunda opción)
4. ✅ Click **"Guardar"**
5. ✅ Esperar 10 minutos
6. ✅ Subir nueva build a Play Console
7. ✅ Instalar desde Play Store
8. ✅ Probar Phone Login → SMS llega sin Error 39

**Tiempo**: 20 minutos (incluye compilación y propagación).

---

## 📖 Notas Importantes

- ⚠️ **"Aplicar" (el botón)** ≠ **"Aplicar" (el modo)**

  - El **botón** se llama "Aplicar" para abrir el panel
  - El **modo estricto** también se llama "Aplicar"
  - Tú necesitas el **modo "Supervisar"** (segunda opción)

- ✅ Después de configurar, Firebase mostrará:

  ```
  Firebase Authentication    ⋮
  Supervisar  ← Correcto
  ```

- 🔄 Si dice "Aplicar" (modo), cámbialo a "Supervisar":
  - Click en ⋮ → Aplicar (botón) → Cambiar a "Supervisar" → Guardar
