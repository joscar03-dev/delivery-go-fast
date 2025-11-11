# ✅ SÍ, Funciona en VPS en Producción

## 🎯 Respuesta Rápida

**SÍ**, el sistema de notificaciones push funcionará igual en tu VPS en producción. El código ya está listo, solo necesitas configurar el entorno.

## 🚀 3 Pasos Esenciales

### 1. Subir `firebase-service-account.json` al VPS

```bash
# En tu VPS
cd /var/www/delivery-go-fast/api-server
# Copiar el archivo desde tu máquina local
# Establecer permisos seguros
chmod 600 firebase-service-account.json
```

### 2. Instalar Dependencias y Compilar

```bash
# En tu VPS
cd /var/www/delivery-go-fast/api-server
npm install
npm run build
```

### 3. Iniciar con PM2

```bash
# En tu VPS
pm2 start dist/main.js --name delivery-api
pm2 save
```

## ✅ El Sistema Ya Incluye Todo

Lo que implementamos funciona **automáticamente** en producción:

- ✅ **EventEmitter2**: Se inicia automáticamente
- ✅ **ScheduleModule**: Cron job se ejecuta a las 3 AM (zona horaria del servidor)
- ✅ **Retry Logic**: 3 intentos con backoff exponencial
- ✅ **Event Listeners**: `@OnEvent` funcionan igual en producción
- ✅ **Firebase Admin SDK**: Se conecta a Firebase Cloud Messaging

## 🔍 Verificar que Funciona

### Script de Verificación Automático

```bash
# En tu VPS
cd /var/www/delivery-go-fast/api-server
chmod +x verify-production.sh
./verify-production.sh
```

Este script verifica:

- ✅ Node.js y dependencias instaladas
- ✅ firebase-service-account.json existe
- ✅ .env configurado
- ✅ Backend compilado (dist/)
- ✅ PostgreSQL con tabla device_tokens
- ✅ PM2 corriendo
- ✅ Nginx configurado
- ✅ Backend responde en localhost:3000

### Verificar Logs en Producción

```bash
# Ver logs en tiempo real
pm2 logs delivery-api

# Buscar inicialización de módulos
pm2 logs delivery-api | grep "EventEmitterModule\|ScheduleModule"

# Debe mostrar:
# ✅ EventEmitterModule dependencies initialized
# ✅ ScheduleModule dependencies initialized
# ✅ Firebase Admin SDK inicializado
```

### Test de Notificación

**Desde la app móvil en producción**:

1. Login → El token se registra automáticamente
2. Crear pedido → Backend emite evento automáticamente
3. Listener ejecuta automáticamente
4. Notificación llega al restaurante

**Ver logs**:

```bash
pm2 logs delivery-api

# Verás:
# [OrdersService] ✅ [Event] Evento 'order.created' emitido
# [NotificationsService] 📨 [Event Listener] Procesando evento
# [NotificationsService] 📨 Notificación enviada: 1 exitosas, 0 fallidas
```

## 🔧 Configuración del Frontend

### Actualizar URL del Backend

**Archivo**: `delivery-frontend/src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  apiUrl: "https://api.tudominio.com", // ← Cambiar a tu VPS
};
```

### Build y Deploy

```bash
# En tu máquina local
cd delivery-frontend
ionic build --prod
ionic capacitor sync android
```

Luego generar APK/AAB firmado en Android Studio.

## ⚠️ Checklist Pre-Deployment

**Antes de subir a producción, verifica**:

- [ ] `firebase-service-account.json` subido al VPS (NO en Git)
- [ ] `.env` con variables de producción configurado
- [ ] Dependencias instaladas: `npm install`
- [ ] Backend compilado: `npm run build`
- [ ] PostgreSQL corriendo con base de datos creada
- [ ] Tabla `device_tokens` existe (ejecutar migraciones)
- [ ] PM2 instalado: `npm install -g pm2`
- [ ] Frontend con `environment.prod.ts` apuntando al VPS
- [ ] SHA-1 de producción agregado en Firebase Console

## 🎯 Diferencias: Desarrollo vs Producción

| Aspecto           | Desarrollo (Local)  | Producción (VPS)            |
| ----------------- | ------------------- | --------------------------- |
| **Código**        | Mismo código        | Mismo código ✅             |
| **EventEmitter**  | Funciona            | Funciona ✅                 |
| **Cron Jobs**     | Funciona            | Funciona ✅                 |
| **Retry Logic**   | Funciona            | Funciona ✅                 |
| **Firebase SDK**  | Funciona            | Funciona ✅                 |
| **URL Backend**   | localhost:3000      | api.tudominio.com           |
| **Proceso**       | `npm run start:dev` | PM2                         |
| **Firebase JSON** | Ruta local          | Ruta en VPS                 |
| **Build**         | No necesario        | `npm run build`             |
| **SSL**           | No necesario        | Recomendado (Let's Encrypt) |

## 📊 Performance en Producción

**Tiempo de respuesta esperado**:

- Crear pedido → Emitir evento: < 50ms
- Evento → Listener ejecuta: < 10ms
- Enviar a Firebase: < 200ms
- Firebase → Dispositivo: 1-5 segundos

**Total end-to-end**: < 6 segundos (incluyendo latencia de red)

## 🔥 Quick Start - Deployment Completo

```bash
# 1. SSH a tu VPS
ssh usuario@tu-vps-ip

# 2. Clonar o actualizar repo
cd /var/www
git clone https://github.com/tu-usuario/delivery-go-fast.git
cd delivery-go-fast/api-server

# 3. Subir firebase-service-account.json
# (usar scp, sftp, o copiarlo manualmente)

# 4. Configurar .env
nano .env
# Pegar configuración de producción

# 5. Instalar y compilar
npm install
npm run build

# 6. Iniciar con PM2
pm2 start dist/main.js --name delivery-api
pm2 startup
pm2 save

# 7. Verificar
./verify-production.sh

# 8. Ver logs
pm2 logs delivery-api
```

## 📚 Documentos de Referencia

- **Guía completa de deployment**: `DEPLOYMENT_VPS_NOTIFICACIONES.md`
- **Script de verificación**: `verify-production.sh`
- **Guía de testing**: `GUIA_PRUEBAS_NOTIFICACIONES_ANDROID.md`
- **Arquitectura del sistema**: `NOTIFICACIONES_PUSH_MEJORAS_COMPLETADAS.md`

## 🎉 Resultado Final

Una vez deployado, el sistema funcionará **exactamente igual** que en desarrollo:

```
Cliente crea pedido (app móvil)
    ↓
Backend en VPS recibe request
    ↓
OrdersService.create() → emit('order.created') [AUTOMÁTICO]
    ↓
NotificationsService.handleOrderCreated() [AUTOMÁTICO]
    ↓
sendWithRetry() → Firebase Cloud Messaging [3 INTENTOS]
    ↓
🔔 Restaurante recibe notificación push
```

**No hay diferencias en el código** - la arquitectura event-driven funciona igual en desarrollo y producción.

---

**Estado**: ✅ LISTO PARA PRODUCCIÓN  
**Requisitos**: VPS + Node.js + PostgreSQL + PM2  
**Tiempo estimado de deployment**: 30 minutos
