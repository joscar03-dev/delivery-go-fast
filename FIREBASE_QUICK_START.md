# 🚀 PASOS RÁPIDOS: Configurar Firebase y Ejecutar Migración

## ⚡ Versión Rápida (5 minutos)

### 📱 **Paso 1: Descargar Credenciales de Firebase**

1. Abre: https://console.firebase.google.com
2. Selecciona tu proyecto **delivery-go-fast**
3. Click en ⚙️ (engranaje) → **"Configuración del proyecto"**
4. Pestaña **"Cuentas de servicio"**
5. Click en **"Generar nueva clave privada"**
6. Confirma y descarga el archivo JSON

**Resultado**: Archivo `delivery-go-fast-firebase-adminsdk-xxxxx-xxxxxxxxxx.json` en Downloads

---

### 🔧 **Paso 2: Configurar Automáticamente**

Opción A - **Con el script automático** (Recomendado):

```bash
cd api-server

# Reemplaza la ruta con la ubicación de tu archivo descargado
node setup-firebase-credentials.js C:\Users\TU_USUARIO\Downloads\delivery-go-fast-firebase-adminsdk-xxxxx.json
```

Opción B - **Manual** (si el script no funciona):

1. Abre el archivo JSON descargado con Notepad
2. Crea/edita el archivo `api-server/.env`
3. Agrega estas líneas:

```env
FIREBASE_PROJECT_ID=delivery-go-fast
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...AQUI_VA_LA_CLAVE_COMPLETA...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@delivery-go-fast.iam.gserviceaccount.com
```

**⚠️ IMPORTANTE**:

- Copia TODA la clave privada (incluye `\n`)
- Usa comillas dobles `"`
- No elimines los `\n` (son importantes)

---

### 🔓 **Paso 3: Habilitar Phone Authentication**

1. En Firebase Console, menú izquierdo → **"Authentication"**
2. Pestaña **"Sign-in method"**
3. Busca **"Phone"** → Click
4. Activa el switch → **"Guardar"**

---

### ✅ **Paso 4: Verificar Configuración**

```bash
cd api-server
npm run start:dev
```

**Busca en la consola**:

```
✅ Firebase Admin SDK inicializado correctamente
```

Si ves ese mensaje, ¡todo está bien! Si hay error, verifica el Paso 2.

---

### 💾 **Paso 5: Ejecutar la Migración**

```bash
# Detener el servidor (Ctrl + C)

# Ejecutar migración
npm run typeorm migration:run

# O si usas el script que tienes:
node run-migration.js
```

**Resultado esperado**:

```
✅ Migración AddPhoneAuthFields completada exitosamente
📊 Total de usuarios en la BD: X
🔐 Todos los usuarios existentes mantienen auth_method=email
📱 Sistema híbrido de autenticación habilitado
```

---

### 🧪 **Paso 6: Probar el Backend**

```bash
# Reiniciar el servidor
npm run start:dev
```

**Probar con Postman o Thunder Client**:

```http
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "tu-email@example.com",
  "password": "tu-password"
}
```

Si el login existente funciona, ¡todo está perfecto! ✅

---

## 🆘 Si Algo Sale Mal

### Error: "FIREBASE_PRIVATE_KEY is undefined"

**Causa**: El archivo `.env` no está en la ubicación correcta o falta reiniciar

**Solución**:

```bash
# 1. Verifica que .env esté en api-server/
dir api-server\.env

# 2. Verifica que tenga contenido
type api-server\.env

# 3. Reinicia el servidor completamente
# Ctrl + C para detener
npm run start:dev
```

### Error: "Firebase project not found"

**Causa**: El PROJECT_ID es incorrecto

**Solución**:

1. Ve a Firebase Console → ⚙️ → Project Settings
2. Copia el **Project ID** exacto (puede ser diferente al nombre del proyecto)
3. Actualiza `FIREBASE_PROJECT_ID` en `.env`

### Error: "Error parsing private key"

**Causa**: La clave privada no tiene el formato correcto

**Solución**:

```env
# La clave debe tener \n (saltos de línea literales)
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQI...\n-----END PRIVATE KEY-----\n"

# O usa el archivo JSON directamente (más fácil):
# Copia el JSON descargado a: api-server/firebase-service-account.json
# Y modifica otp.service.ts para usar:
# admin.credential.cert(require('../../../firebase-service-account.json'))
```

---

## 📊 Checklist Final

- [ ] Archivo JSON de Firebase descargado
- [ ] Variables configuradas en `.env` (o JSON copiado)
- [ ] Phone Authentication habilitado en Firebase
- [ ] Servidor inicia sin errores
- [ ] Migración ejecutada exitosamente
- [ ] Login con email funciona (compatibilidad verificada)

---

## 🎯 Después de Completar

¡Felicidades! Ahora tienes:

✅ Backend con soporte híbrido email + phone
✅ Base de datos con campos nuevos
✅ Firebase configurado
✅ Sistema listo para recibir OTPs desde el frontend

**Próximo paso**: Implementar el frontend (Phone Login UI)

---

## 📞 ¿Necesitas Ayuda?

Si algo no funciona:

1. **Revisa los logs**: El servidor muestra mensajes claros con emojis
2. **Verifica el .env**: `type api-server\.env`
3. **Consulta la guía completa**: `FIREBASE_CREDENTIALS_SETUP.md`
4. **Prueba el script automático**: `setup-firebase-credentials.js`

---

**Tiempo estimado**: 5-10 minutos
**Dificultad**: ⭐⭐☆☆☆ (Fácil)
