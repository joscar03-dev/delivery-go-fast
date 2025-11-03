# 📱 Guía de Conexión: App Móvil → Backend Local

## 🎯 Problema Común

La app móvil (Android/iOS) no se conecta al backend cuando está corriendo en `localhost:3000`.

## 💡 Por qué sucede

- **Navegador web**: `localhost` = tu computadora ✅
- **Emulador Android**: `localhost` = el emulador mismo ❌
- **Dispositivo físico**: `localhost` = el dispositivo ❌

## 🔧 Soluciones según el escenario

### 📱 **Emulador de Android**

**IP especial**: `10.0.2.2` (mapea a `localhost` de tu PC)

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: "http://10.0.2.2:3000", // ✅ Emulador Android
};
```

### 📱 **Emulador de iOS**

**IP**: Usa `localhost` directamente

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: "http://localhost:3000", // ✅ Emulador iOS
};
```

### 📱 **Dispositivo Físico (Android/iOS)**

**IP de tu PC en la red local**: Ejemplo `192.168.1.X`

#### Paso 1: Obtener tu IP

**Windows**:

```powershell
ipconfig
# Busca "IPv4 Address" en tu adaptador de red WiFi/Ethernet
# Ejemplo: 192.168.1.105
```

**Mac/Linux**:

```bash
ifconfig
# Busca "inet" en tu adaptador de red
```

#### Paso 2: Usar esa IP

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: "http://192.168.1.105:3000", // ✅ Tu IP real
};
```

**IMPORTANTE**: Tu dispositivo debe estar en la **misma red WiFi** que tu PC.

---

## 🛠️ Configuración ya aplicada

### 1. ✅ **environment.ts**

```typescript
// Configurado para emulador Android
apiUrl: "http://10.0.2.2:3000";
```

### 2. ✅ **network_security_config.xml**

Permite conexiones HTTP no seguras (solo desarrollo):

```xml
<domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="true">10.0.2.2</domain>
    <domain includeSubdomains="true">localhost</domain>
    <domain includeSubdomains="true">192.168.1.0/24</domain>
</domain-config>
```

### 3. ✅ **AndroidManifest.xml**

```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    android:usesCleartextTraffic="true">
```

### 4. ✅ **CORS en Backend (main.ts)**

```typescript
app.enableCors({
  origin: [
    "http://localhost:8100", // Web dev
    "http://10.0.2.2:8100", // Android emulator
    "capacitor://localhost", // iOS
    "ionic://localhost", // Ionic
  ],
  credentials: true,
});
```

---

## 🧪 Cómo Probar

### 1. **Backend corriendo**

```bash
cd api-server
npm run start:dev

# Verifica que esté escuchando en:
# http://localhost:3000
```

### 2. **Verificar conexión desde PC**

Abre en tu navegador:

```
http://localhost:3000
```

Deberías ver: `Hello World!` o similar.

### 3. **Verificar desde emulador Android**

Abre el navegador del emulador y ve a:

```
http://10.0.2.2:3000
```

Si ves el mensaje, la conexión funciona ✅

### 4. **Ejecutar la app**

```bash
cd delivery-frontend
npx cap sync android
npx cap open android
```

En Android Studio, presiona **Run** (▶️)

### 5. **Verificar logs**

Abre **Logcat** en Android Studio y busca:

```
✅ API URL: http://10.0.2.2:3000
❌ Error connecting to http://localhost:3000  (si no cambiaste la config)
```

---

## 🔄 Cambiar entre escenarios

### Script de configuración rápida

Crea archivos separados:

```typescript
// environment.android-emulator.ts
export const environment = {
  production: false,
  apiUrl: "http://10.0.2.2:3000",
};

// environment.device.ts
export const environment = {
  production: false,
  apiUrl: "http://192.168.1.105:3000", // Tu IP
};

// environment.ts (desarrollo web)
export const environment = {
  production: false,
  apiUrl: "http://localhost:3000",
};
```

Luego copia el que necesites:

```bash
# Para emulador Android
cp environment.android-emulator.ts environment.ts

# Para dispositivo físico
cp environment.device.ts environment.ts
```

---

## 🚨 Troubleshooting

### ❌ "Network Error" o "Failed to fetch"

**Solución**:

1. Verifica que el backend esté corriendo
2. Verifica la IP en `environment.ts`
3. Asegúrate de haber ejecutado `npx cap sync`
4. Reinicia la app en el emulador

### ❌ "CORS Error"

**Solución**:

- Verifica que agregaste la IP en `main.ts` del backend
- Reinicia el servidor backend

### ❌ "ERR_CLEARTEXT_NOT_PERMITTED"

**Solución**:

- Verifica que `network_security_config.xml` existe
- Verifica que está referenciado en `AndroidManifest.xml`
- Limpia y reconstruye: `cd android && ./gradlew clean`

### ❌ Backend no responde desde emulador

**Solución**:

1. Verifica firewall de Windows:

   - Busca "Firewall de Windows"
   - "Permitir una aplicación a través del Firewall"
   - Agrega `node.exe` si no está

2. Prueba con Postman o navegador del emulador primero

---

## 🌐 Para Producción

En producción, usa tu dominio real:

```typescript
// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: "https://api.delivery-go-fast.com", // ✅ HTTPS
};
```

**IMPORTANTE**:

- ❌ Nunca usar `http` en producción
- ✅ Siempre usar `https`
- ✅ Remover `usesCleartextTraffic="true"`
- ✅ Actualizar `network_security_config.xml`

---

## 📋 Checklist Rápido

Antes de probar la app móvil:

- [ ] Backend corriendo en `localhost:3000`
- [ ] `environment.ts` tiene la IP correcta
- [ ] Ejecutaste `npm run build`
- [ ] Ejecutaste `npx cap sync android`
- [ ] Firewall permite conexiones a Node.js
- [ ] (Dispositivo físico) Estás en la misma WiFi

---

## 🎯 Configuración Actual

```
✅ API URL: http://10.0.2.2:3000
✅ Configurado para: Emulador Android
✅ CORS: Habilitado en backend
✅ HTTP cleartext: Permitido
```

**Para cambiar a dispositivo físico**:

1. Obtén tu IP: `ipconfig` (Windows)
2. Actualiza `environment.ts`: `apiUrl: 'http://TU_IP:3000'`
3. Recompila: `npm run build && npx cap sync android`

---

**Última actualización**: 1 de noviembre de 2025
