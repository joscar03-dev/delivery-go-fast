# 🚀 Guía de Deployment a VPS - Sistema de Notificaciones Push

## ✅ Respuesta Rápida

**SÍ, funcionará en tu VPS en producción**, pero necesitas configurar algunas cosas adicionales.

## 📋 Checklist de Deployment

### 1️⃣ Backend en VPS

#### A. Archivos Necesarios

**CRÍTICO**: Subir `firebase-service-account.json` al VPS

```bash
# En tu VPS, en el directorio del proyecto
/var/www/delivery-go-fast/api-server/firebase-service-account.json
```

⚠️ **NUNCA subir este archivo a Git** - usar `.gitignore`:

```gitignore
# .gitignore
firebase-service-account.json
*.json.key
serviceAccountKey.json
```

#### B. Variables de Entorno

Crear o actualizar `.env` en el VPS:

```bash
# api-server/.env

# Base de datos
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=tu_password_seguro
DATABASE_NAME=delivery_db

# JWT
JWT_SECRET=tu_jwt_secret_super_seguro_produccion
JWT_EXPIRES_IN=7d

# Ruta de credenciales Firebase (absoluta o relativa)
FIREBASE_CREDENTIALS_PATH=/var/www/delivery-go-fast/api-server/firebase-service-account.json

# Puerto
PORT=3000

# Node Environment
NODE_ENV=production
```

#### C. Paquetes Instalados en VPS

```bash
# Conectar por SSH a tu VPS
ssh usuario@tu-vps-ip

# Ir al directorio del backend
cd /var/www/delivery-go-fast/api-server

# Instalar dependencias (incluye las nuevas)
npm install

# Debe instalar:
# - @nestjs/event-emitter
# - @nestjs/schedule
# - firebase-admin (ya debería estar)
```

#### D. Build del Backend

```bash
# En el VPS
cd /var/www/delivery-go-fast/api-server
npm run build

# Verificar que se crea la carpeta dist/
ls -la dist/
```

#### E. Proceso Manager (PM2)

**Opción recomendada: PM2**

```bash
# Instalar PM2 globalmente (si no lo tienes)
npm install -g pm2

# Iniciar la aplicación
cd /var/www/delivery-go-fast/api-server
pm2 start dist/main.js --name delivery-api

# Configurar auto-restart en reboot del servidor
pm2 startup
pm2 save

# Ver logs en tiempo real
pm2 logs delivery-api

# Verificar estado
pm2 status
```

**Logs esperados**:

```
[Nest] LOG [InstanceLoader] EventEmitterModule dependencies initialized ✅
[Nest] LOG [InstanceLoader] ScheduleModule dependencies initialized ✅
[Nest] LOG [NotificationsService] ✅ Firebase Admin SDK inicializado ✅
```

#### F. Nginx como Reverse Proxy

**Configuración de Nginx** (`/etc/nginx/sites-available/delivery-api`):

```nginx
server {
    listen 80;
    server_name api.tudominio.com;  # O tu IP pública

    # Redirigir HTTP a HTTPS (recomendado)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.tudominio.com;

    # Certificados SSL (usar Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/api.tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.tudominio.com/privkey.pem;

    # Proxy al backend NestJS
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support (para delivery tracking)
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**Habilitar y recargar Nginx**:

```bash
# Crear symlink
sudo ln -s /etc/nginx/sites-available/delivery-api /etc/nginx/sites-enabled/

# Verificar configuración
sudo nginx -t

# Recargar Nginx
sudo systemctl reload nginx
```

### 2️⃣ Frontend (App Android)

#### A. Actualizar URL del Backend

**Archivo**: `delivery-frontend/src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  apiUrl: "https://api.tudominio.com", // ← URL de tu VPS
  // O si no tienes dominio:
  // apiUrl: 'http://TU_IP_VPS:3000',

  firebase: {
    // Configuración de Firebase (debe ser la misma)
    apiKey: "tu-api-key",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto-id",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:android:abc123",
  },
};
```

#### B. Build de Producción

```bash
# En tu máquina local
cd delivery-frontend

# Build con environment.prod.ts
ionic build --prod

# Sincronizar con Capacitor
ionic capacitor sync android

# Abrir Android Studio
ionic capacitor open android
```

#### C. Generar APK/AAB Firmado

**En Android Studio**:

1. Build → Generate Signed Bundle / APK
2. Seleccionar "Android App Bundle" (para Google Play) o "APK"
3. Configurar keystore (o crear uno nuevo)
4. Build release
5. Subir a Google Play Console o instalar directamente

### 3️⃣ Firebase Configuration

#### A. Verificar Configuración en Firebase Console

1. **Firebase Console** → Tu proyecto
2. **Project Settings** → Service Accounts
3. Verificar que el `firebase-service-account.json` que subiste al VPS es el correcto

#### B. Agregar SHA-1 de la APK de Producción

**Obtener SHA-1 del keystore de producción**:

```bash
# En tu máquina local
keytool -list -v -keystore tu-keystore.jks -alias tu-alias
```

**Agregar en Firebase Console**:

1. Project Settings → General
2. Scroll a "Your apps" → Android app
3. Click en el icono de engranaje
4. "Add fingerprint" → Pegar SHA-1
5. Descargar el nuevo `google-services.json`
6. Reemplazar en: `delivery-frontend/android/app/google-services.json`
7. Re-build la app

### 4️⃣ Base de Datos PostgreSQL en VPS

#### A. Verificar Tablas Existen

```bash
# Conectar a PostgreSQL en VPS
sudo -u postgres psql delivery_db

# Verificar tabla device_tokens existe
\dt

# Ver estructura
\d device_tokens

# Debe tener estas columnas:
# - id
# - userId
# - token
# - deviceId
# - platform
# - isActive
# - lastUsedAt
# - createdAt
# - updatedAt
```

#### B. Si la Tabla NO Existe, Ejecutar Migración

```bash
# En el VPS
cd /var/www/delivery-go-fast/api-server

# Ejecutar migraciones
npm run migration:run

# O crear la tabla manualmente:
sudo -u postgres psql delivery_db < migrations/create-device-tokens-table.sql
```

### 5️⃣ Seguridad en Producción

#### A. Firewall (UFW)

```bash
# Permitir solo puertos necesarios
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 5432/tcp  # PostgreSQL (solo si accedes remotamente)

# Habilitar firewall
sudo ufw enable

# Verificar estado
sudo ufw status
```

#### B. Proteger firebase-service-account.json

```bash
# Solo el usuario de la app debe poder leerlo
sudo chown tu-usuario:tu-usuario /var/www/delivery-go-fast/api-server/firebase-service-account.json
sudo chmod 600 /var/www/delivery-go-fast/api-server/firebase-service-account.json
```

#### C. Variables de Entorno Seguras

**NO hardcodear en código** - usar `.env`:

```bash
# En el VPS, crear .env
cd /var/www/delivery-go-fast/api-server
nano .env

# Pegar configuración de producción (ver arriba)
```

**Agregar .env al .gitignore**:

```gitignore
.env
.env.local
.env.production
```

### 6️⃣ Monitoreo en Producción

#### A. Logs de PM2

```bash
# Ver logs en tiempo real
pm2 logs delivery-api

# Ver logs de eventos
pm2 logs delivery-api --lines 100 | grep "Event"

# Ver logs de notificaciones
pm2 logs delivery-api --lines 100 | grep "Notification"
```

#### B. Logs de Nginx

```bash
# Logs de acceso
sudo tail -f /var/log/nginx/access.log

# Logs de errores
sudo tail -f /var/log/nginx/error.log
```

#### C. Verificar Cron Job

```bash
# Ver logs del cron job de limpieza (se ejecuta a las 3 AM)
pm2 logs delivery-api | grep "Cron"

# Debe mostrar:
# 🧹 [Cron] Iniciando limpieza de tokens antiguos...
# ✅ [Cron] Limpiados X tokens inactivos antiguos
```

#### D. Dashboard de Firebase

Firebase Console → Cloud Messaging → Ver estadísticas:

- Notificaciones enviadas
- Tasa de éxito
- Errores

### 7️⃣ Testing en Producción

#### A. Verificar Backend

```bash
# Desde cualquier máquina
curl https://api.tudominio.com

# Debe responder:
# {"message":"API de Delivery corriendo correctamente"}
```

#### B. Verificar Registro de Token

**Instalar app en dispositivo real** → Login → Ver logs en VPS:

```bash
pm2 logs delivery-api

# Debe mostrar:
# [NotificationsService] 📱 Token registrado para usuario {userId}
```

#### C. Crear Pedido de Prueba

**Desde la app** → Crear pedido → Ver logs:

```bash
pm2 logs delivery-api | grep "order.created"

# Debe mostrar:
# [OrdersService] ✅ [Event] Evento 'order.created' emitido
# [NotificationsService] 📨 [Event Listener] Procesando evento
# [NotificationsService] 📨 Notificación enviada: 1 exitosas, 0 fallidas
```

## 🔥 Script de Deployment Automático

Crear `deploy.sh` en tu VPS:

```bash
#!/bin/bash

# deploy.sh - Script de deployment automatizado

echo "🚀 Iniciando deployment..."

# 1. Actualizar código
cd /var/www/delivery-go-fast
git pull origin main

# 2. Backend
echo "📦 Instalando dependencias del backend..."
cd api-server
npm install

echo "🔨 Compilando backend..."
npm run build

echo "♻️ Reiniciando backend con PM2..."
pm2 restart delivery-api

# 3. Verificar estado
sleep 5
pm2 status

echo "✅ Deployment completado!"
echo "📊 Ver logs: pm2 logs delivery-api"
```

**Hacer ejecutable**:

```bash
chmod +x deploy.sh
```

**Usar**:

```bash
./deploy.sh
```

## ⚠️ Problemas Comunes en Producción

### Error: "Firebase not initialized"

**Solución**: Verificar que `firebase-service-account.json` existe y tiene permisos:

```bash
ls -la /var/www/delivery-go-fast/api-server/firebase-service-account.json
```

### Error: "Cannot find module @nestjs/event-emitter"

**Solución**: Instalar dependencias:

```bash
cd /var/www/delivery-go-fast/api-server
npm install
```

### Notificaciones no llegan

**Verificar**:

1. App usa `environment.prod.ts` con URL correcta del VPS
2. Firebase Admin SDK inicializado (ver logs)
3. Tokens registrados en base de datos:
   ```sql
   SELECT COUNT(*) FROM device_tokens WHERE isActive = true;
   ```
4. Firewall no bloquea conexiones a Firebase

### Cron job no ejecuta

**Verificar zona horaria del servidor**:

```bash
timedatectl status

# El cron se ejecuta a las 3 AM de la zona horaria del servidor
```

## 📊 Checklist Final de Producción

- [ ] VPS con Node.js instalado
- [ ] PostgreSQL con base de datos creada
- [ ] `firebase-service-account.json` subido al VPS (con permisos 600)
- [ ] `.env` configurado con variables de producción
- [ ] Dependencias instaladas: `npm install`
- [ ] Backend compilado: `npm run build`
- [ ] PM2 configurado y corriendo
- [ ] Nginx configurado como reverse proxy
- [ ] SSL/HTTPS configurado (Let's Encrypt)
- [ ] Frontend con `environment.prod.ts` apuntando al VPS
- [ ] SHA-1 de producción agregado a Firebase Console
- [ ] App de producción compilada y firmada
- [ ] Firewall configurado (UFW)
- [ ] Logs verificados: EventEmitter, Schedule, Firebase
- [ ] Test de creación de pedido → notificación recibida

## 🎯 Resultado Esperado en Producción

```
Usuario crea pedido desde app móvil (cualquier parte del mundo)
    ↓
Backend en VPS recibe request
    ↓
EventEmitter emite 'order.created'
    ↓
NotificationsService.handleOrderCreated() ejecuta
    ↓
sendWithRetry() envía a Firebase Cloud Messaging
    ↓
Firebase entrega notificación push
    ↓
Usuario restaurante recibe notificación (cualquier parte del mundo)
```

**Tiempo esperado**: < 2 segundos end-to-end

## 📚 Documentos de Referencia

- **Backend**: `NOTIFICACIONES_PUSH_MEJORAS_COMPLETADAS.md`
- **Testing local**: `GUIA_PRUEBAS_NOTIFICACIONES_ANDROID.md`
- **Arquitectura**: `ANALISIS_NOTIFICACIONES_PUSH.md`

---

**Estado**: ✅ LISTO PARA PRODUCCIÓN  
**Arquitectura**: Event-Driven con Retry Logic  
**Deployment**: VPS + PM2 + Nginx  
**Fecha**: 11/11/2025
