# 🔥 Guía: Configurar Credenciales de Firebase para Phone Auth

## 📋 Requisitos Previos

- Cuenta de Google
- Acceso a Firebase Console: https://console.firebase.google.com

---

## 🎯 Paso 1: Acceder a tu Proyecto Firebase

1. Ve a **Firebase Console**: https://console.firebase.google.com
2. Busca tu proyecto: **delivery-go-fast** (o el nombre que le hayas dado)
3. Haz clic en el proyecto para abrirlo

> ⚠️ **Si no tienes proyecto creado:**
>
> - Haz clic en "Agregar proyecto"
> - Nombre: `delivery-go-fast`
> - Sigue los pasos del asistente

---

## 🔑 Paso 2: Generar Clave Privada (Service Account)

### **Opción Visual (Recomendada):**

1. En Firebase Console, haz clic en el **ícono de engranaje ⚙️** (arriba izquierda)
2. Selecciona **"Configuración del proyecto"** / **"Project Settings"**
3. Ve a la pestaña **"Cuentas de servicio"** / **"Service accounts"**
4. Verás una sección que dice: **"Firebase Admin SDK"**
5. Haz clic en el botón **"Generar nueva clave privada"** / **"Generate new private key"**
6. Aparecerá un diálogo de confirmación
7. Haz clic en **"Generar clave"** / **"Generate key"**
8. Se descargará un archivo JSON (ej: `delivery-go-fast-firebase-adminsdk-xxxxx-xxxxxxxxxx.json`)

### **📂 Ubicación del archivo descargado:**

Por defecto se descarga en: `C:\Users\TU_USUARIO\Downloads\`

---

## 📄 Paso 3: Extraer las Credenciales del JSON

El archivo JSON descargado tiene esta estructura:

```json
{
  "type": "service_account",
  "project_id": "delivery-go-fast",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@delivery-go-fast.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

### **Campos que necesitas:**

- ✅ `project_id`
- ✅ `private_key`
- ✅ `client_email`

---

## 🔧 Paso 4: Configurar Variables de Entorno

### **Opción A: Archivo .env (Recomendado para desarrollo)**

Abre el archivo: `api-server/.env`

Agrega estas líneas:

```env
# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=delivery-go-fast
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASC...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@delivery-go-fast.iam.gserviceaccount.com
```

#### **⚠️ IMPORTANTE sobre FIREBASE_PRIVATE_KEY:**

La clave privada tiene saltos de línea (`\n`). Tienes 2 opciones:

**Opción 1 - Una sola línea (más fácil):**

```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9...\n-----END PRIVATE KEY-----\n"
```

**Opción 2 - Con comillas y escape:**

```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASC...
-----END PRIVATE KEY-----
"
```

### **Opción B: Usar el archivo JSON completo**

Si prefieres usar el archivo JSON directamente:

1. Copia el archivo JSON descargado a: `api-server/firebase-service-account.json`
2. Modifica `otp.service.ts` para usar el archivo:

```typescript
// En src/auth/services/otp.service.ts
admin.initializeApp({
  credential: admin.credential.cert(
    require("../../../firebase-service-account.json")
  ),
});
```

---

## 🔒 Paso 5: Seguridad - Agregar al .gitignore

**¡MUY IMPORTANTE!** No subas las credenciales a GitHub.

Abre: `api-server/.gitignore`

Agrega:

```
# Firebase credentials
firebase-service-account.json
.env
.env.local
.env.production
```

---

## 🧪 Paso 6: Verificar la Configuración

Después de configurar el `.env`, verifica que el backend puede iniciar:

```bash
cd api-server
npm run start:dev
```

Si ves en la consola:

```
✅ Firebase Admin SDK inicializado correctamente
```

**¡Listo!** Las credenciales están configuradas correctamente.

---

## 📱 Paso 7: Habilitar Phone Authentication en Firebase

Para que Phone Auth funcione, debes habilitarlo en Firebase:

1. En Firebase Console, ve a **"Authentication"** (en el menú izquierdo)
2. Haz clic en la pestaña **"Sign-in method"**
3. Busca **"Phone"** en la lista de proveedores
4. Haz clic en **"Phone"**
5. Activa el switch **"Enable"** / **"Habilitar"**
6. Haz clic en **"Save"** / **"Guardar"**

---

## 🌍 Paso 8: Agregar Dominios Autorizados

Para que reCAPTCHA funcione (necesario para Phone Auth):

1. En **Authentication → Settings** (pestaña superior)
2. Baja hasta **"Authorized domains"** / **"Dominios autorizados"**
3. Por defecto ya están:

   - `localhost`
   - `tu-proyecto.firebaseapp.com`
   - `tu-proyecto.web.app`

4. Si usarás un dominio personalizado, agrégalo aquí

---

## 📊 Resumen de lo que Necesitas

### **Variables de Entorno (.env)**

```env
FIREBASE_PROJECT_ID=tu-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com
```

### **Checklist Final**

- [ ] Proyecto Firebase creado
- [ ] Service Account Key descargado (JSON)
- [ ] Variables en `.env` configuradas
- [ ] Phone Authentication habilitado en Firebase Console
- [ ] Dominios autorizados configurados
- [ ] `.gitignore` actualizado
- [ ] Backend inicia sin errores

---

## 🆘 Solución de Problemas

### **Error: "Firebase Admin SDK ya está inicializado"**

- ✅ Normal, significa que funciona. El código previene inicialización duplicada.

### **Error: "FIREBASE_PRIVATE_KEY is undefined"**

- ❌ No se encontró la variable de entorno
- **Solución**: Verifica que el archivo `.env` esté en `api-server/` (no en la raíz)
- **Solución 2**: Reinicia el servidor después de agregar el `.env`

### **Error: "Error parsing private key"**

- ❌ La clave privada tiene formato incorrecto
- **Solución**: Asegúrate de incluir `\n` en los saltos de línea
- **Solución 2**: Usa comillas dobles `"` para encerrar la clave

### **Error: "Firebase project not found"**

- ❌ El PROJECT_ID es incorrecto
- **Solución**: Verifica en Firebase Console → Project Settings → Project ID

### **Error: "Phone authentication is not enabled"**

- ❌ Phone Auth no está habilitado en Firebase
- **Solución**: Authentication → Sign-in method → Phone → Enable

---

## 📚 Recursos Adicionales

- **Firebase Console**: https://console.firebase.google.com
- **Firebase Admin SDK Docs**: https://firebase.google.com/docs/admin/setup
- **Phone Auth Docs**: https://firebase.google.com/docs/auth/web/phone-auth
- **Service Account Keys**: https://console.cloud.google.com/iam-admin/serviceaccounts

---

## ✅ Siguiente Paso

Una vez que hayas completado todos los pasos de esta guía, podrás:

1. **Ejecutar la migración**: `npm run typeorm migration:run`
2. **Probar Phone Auth**: Usar Postman para probar `/auth/phone/register`
3. **Continuar con el frontend**: Implementar la UI de Phone Login

---

**Última actualización**: 7 de noviembre de 2025  
**Versión**: 1.0
