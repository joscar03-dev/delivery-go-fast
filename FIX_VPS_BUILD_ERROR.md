# 🔧 Solución: Error "Cannot find module dist/main.js" en VPS

## ❌ Error

```
Error: Cannot find module '/var/www/delivery-go-fast/api-server/dist/main.js'
code: 'MODULE_NOT_FOUND'
```

## 🎯 Causa

El proyecto **no está compilado** en el VPS. PM2 está intentando ejecutar `dist/main.js` pero ese archivo no existe porque no se ejecutó `npm run build`.

## ✅ Solución Paso a Paso

### 1️⃣ Conectar al VPS por SSH

```bash
ssh usuario@tu-vps-ip
# O si usas clave SSH:
ssh -i /ruta/a/tu-clave.pem usuario@tu-vps-ip
```

### 2️⃣ Ir al Directorio del Proyecto

```bash
cd /var/www/delivery-go-fast/api-server
```

### 3️⃣ Verificar que NO Existe la Carpeta dist/

```bash
ls -la dist/
# Si da error "No such file or directory", confirma que no existe
```

### 4️⃣ Detener PM2 (Importante)

```bash
# Detener la app en PM2
pm2 stop delivery-api

# O detener todas las apps
pm2 stop all
```

### 5️⃣ Instalar/Actualizar Dependencias

```bash
# Asegurarse de que todas las dependencias están instaladas
npm install

# Esto debe instalar:
# - @nestjs/event-emitter
# - @nestjs/schedule
# - firebase-admin
# - y todas las demás dependencias
```

**Espera a que termine**. Debería decir algo como:
```
added X packages, and audited Y packages in Zs
```

### 6️⃣ Compilar el Proyecto (BUILD)

```bash
npm run build
```

**Esto es lo más importante**. Debe compilar el código TypeScript a JavaScript y crear la carpeta `dist/`.

**Salida esperada**:
```
> api-server@0.0.1 build
> nest build

✔ Compilation complete
```

### 7️⃣ Verificar que dist/ Existe

```bash
# Verificar que se creó la carpeta dist/
ls -la dist/

# Debe mostrar:
# main.js
# main.js.map
# y muchos otros archivos .js
```

### 8️⃣ Verificar que main.js Existe

```bash
# Verificar el archivo específico que PM2 necesita
ls -la dist/main.js

# Debe mostrar algo como:
# -rw-r--r-- 1 usuario usuario 123456 Nov 11 18:00 dist/main.js
```

### 9️⃣ Reiniciar PM2

```bash
# Reiniciar la aplicación
pm2 restart delivery-api

# Si no existe, iniciarla:
pm2 start dist/main.js --name delivery-api
```

### 🔟 Verificar que Funciona

```bash
# Ver logs en tiempo real
pm2 logs delivery-api

# Debe mostrar:
# [Nest] LOG [NestFactory] Starting Nest application...
# [Nest] LOG [InstanceLoader] EventEmitterModule dependencies initialized
# [Nest] LOG [InstanceLoader] ScheduleModule dependencies initialized
# [Nest] LOG [NotificationsService] ✅ Firebase Admin SDK inicializado
# [Nest] LOG [NestApplication] Nest application successfully started
```

### 1️⃣1️⃣ Guardar Configuración de PM2

```bash
# Guardar la configuración actual de PM2
pm2 save

# Configurar PM2 para que se inicie automáticamente al reiniciar el servidor
pm2 startup
# Ejecutar el comando que PM2 te muestre
```

## 🚨 Si el Build Falla

### Error: "Cannot find module @nestjs/event-emitter"

**Solución**:
```bash
npm install @nestjs/event-emitter @nestjs/schedule
npm run build
```

### Error: "Cannot find module firebase-admin"

**Solución**:
```bash
npm install firebase-admin
npm run build
```

### Error: "EACCES: permission denied"

**Solución**:
```bash
# Cambiar permisos del directorio
sudo chown -R $USER:$USER /var/www/delivery-go-fast

# O ejecutar con sudo (no recomendado)
sudo npm run build
```

### Error: "Out of memory"

**Solución** (si tu VPS tiene poca RAM):
```bash
# Aumentar memoria para Node.js
export NODE_OPTIONS="--max-old-space-size=2048"
npm run build
```

### Error de TypeScript

**Solución**:
```bash
# Ver errores específicos
npm run build 2>&1 | grep "error TS"

# Instalar TypeScript globalmente si no está
npm install -g typescript

# Verificar versión
tsc --version
```

## 📋 Script de Deployment Automático

Crea este script para futuros deployments:

```bash
# En tu VPS, crear archivo: deploy.sh
nano /var/www/delivery-go-fast/api-server/deploy.sh
```

**Contenido del deploy.sh**:

```bash
#!/bin/bash

echo "🚀 Iniciando deployment..."

# Ir al directorio
cd /var/www/delivery-go-fast/api-server

# Detener PM2
echo "⏸️ Deteniendo PM2..."
pm2 stop delivery-api

# Actualizar código (si usas Git)
echo "📥 Actualizando código..."
git pull origin main

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Compilar
echo "🔨 Compilando proyecto..."
npm run build

# Verificar que dist/main.js existe
if [ ! -f "dist/main.js" ]; then
    echo "❌ ERROR: dist/main.js no se creó"
    exit 1
fi

# Reiniciar PM2
echo "▶️ Reiniciando PM2..."
pm2 restart delivery-api

# Guardar configuración
pm2 save

echo "✅ Deployment completado!"
echo ""
echo "📊 Ver logs: pm2 logs delivery-api"
echo "📈 Ver estado: pm2 status"
```

**Hacer ejecutable**:
```bash
chmod +x deploy.sh
```

**Usar**:
```bash
./deploy.sh
```

## 🔍 Comandos de Debugging

### Ver estado de PM2
```bash
pm2 status
```

### Ver logs de error
```bash
pm2 logs delivery-api --err
```

### Ver logs completos
```bash
pm2 logs delivery-api --lines 100
```

### Ver procesos en ejecución
```bash
pm2 list
```

### Eliminar app de PM2 y reiniciar desde cero
```bash
pm2 delete delivery-api
pm2 start dist/main.js --name delivery-api
pm2 save
```

## ✅ Checklist de Verificación

Después de seguir los pasos, verifica:

- [ ] `npm install` se ejecutó sin errores
- [ ] `npm run build` se ejecutó sin errores
- [ ] Existe el archivo `dist/main.js`
- [ ] PM2 muestra status "online" para delivery-api
- [ ] Los logs de PM2 no muestran errores
- [ ] El backend responde: `curl http://localhost:3000`
- [ ] Los módulos están inicializados (EventEmitter, Schedule, Firebase)

## 🎯 Resumen de Comandos Rápidos

```bash
# Conectar a VPS
ssh usuario@tu-vps-ip

# Ir al directorio
cd /var/www/delivery-go-fast/api-server

# Detener PM2
pm2 stop delivery-api

# Instalar y compilar
npm install
npm run build

# Verificar
ls -la dist/main.js

# Reiniciar
pm2 restart delivery-api

# Ver logs
pm2 logs delivery-api
```

## 📝 Notas Importantes

1. **Siempre detener PM2 antes de compilar** para evitar conflictos
2. **El comando `npm run build` es OBLIGATORIO** en producción
3. **Verificar que dist/main.js existe** antes de iniciar PM2
4. **Guardar con `pm2 save`** para que sobreviva a reinicios del servidor

---

**Estado**: 📖 GUÍA DE SOLUCIÓN  
**Causa**: Proyecto no compilado en VPS  
**Solución**: Ejecutar `npm run build` antes de iniciar PM2
