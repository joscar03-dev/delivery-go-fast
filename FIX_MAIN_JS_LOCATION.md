# 🔧 Solución REAL: main.js está en dist/src/ no en dist/

## ❌ Problema Real

El archivo `main.js` se compila en **`dist/src/main.js`** en lugar de `dist/main.js` porque hay archivos TypeScript en la raíz del proyecto que también se están compilando.

**Estructura actual**:

```
dist/
  ├── check-delivery-type.js  (archivo de la raíz)
  ├── migrate-delivery-type.js (archivo de la raíz)
  └── src/
      └── main.js  ← AQUÍ ESTÁ
```

## ✅ Solución 1: Actualizar Comando de PM2 (Recomendado - Más Fácil)

### En Local (para testing):

```bash
cd c:\laragon\www\delivery-go-fast\api-server
npm run build

# Iniciar con la ruta correcta
node dist/src/main.js
```

### En VPS:

```bash
# Conectar a VPS
ssh usuario@tu-vps-ip

# Ir al directorio
cd /var/www/delivery-go-fast/api-server

# Detener PM2
pm2 stop delivery-api
pm2 delete delivery-api

# Instalar y compilar
npm install
npm run build

# Verificar que main.js está en dist/src/
ls -la dist/src/main.js

# Iniciar PM2 con la ruta CORRECTA
pm2 start dist/src/main.js --name delivery-api

# Guardar
pm2 save

# Ver logs
pm2 logs delivery-api
```

### Actualizar package.json

También debes actualizar el script `start:prod` en `package.json`:

```json
{
  "scripts": {
    "start:prod": "node dist/src/main"
  }
}
```

## ✅ Solución 2: Mover Archivos TypeScript Fuera de la Raíz (Más Limpio)

Si quieres que `main.js` esté en `dist/main.js` directamente:

### 1. Crear carpeta para scripts

```bash
# En local
cd c:\laragon\www\delivery-go-fast\api-server
mkdir scripts
```

### 2. Mover archivos TypeScript de la raíz

```bash
# Mover archivos de migración/scripts a la carpeta scripts/
move check-delivery-type.ts scripts/
move migrate-delivery-type.ts scripts/
```

### 3. Actualizar nest-cli.json para excluir scripts/

**Archivo**: `api-server/nest-cli.json`

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "entryFile": "main",
  "compilerOptions": {
    "deleteOutDir": true,
    "assets": ["**/*.json"],
    "watchAssets": true
  }
}
```

### 4. Actualizar tsconfig.json para excluir scripts/

**Archivo**: `api-server/tsconfig.json`

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false
  },
  "exclude": ["node_modules", "dist", "scripts"]
}
```

### 5. Recompilar

```bash
# Eliminar dist/ y recompilar
rm -rf dist
npm run build

# Ahora main.js debería estar en dist/main.js
ls -la dist/main.js
```

## 🎯 Comparación de Soluciones

| Aspecto        | Solución 1 (PM2 path)   | Solución 2 (Mover scripts)         |
| -------------- | ----------------------- | ---------------------------------- |
| **Facilidad**  | ⭐⭐⭐⭐⭐ Muy fácil    | ⭐⭐⭐ Medio                       |
| **Cambios**    | Solo PM2 y package.json | Mover archivos, actualizar configs |
| **Riesgo**     | ⭐ Ninguno              | ⭐⭐ Bajo (puede romper scripts)   |
| **Tiempo**     | 2 minutos               | 10 minutos                         |
| **Producción** | Funciona igual          | Funciona igual                     |

## 📋 Script de Deployment Actualizado

**Para usar con dist/src/main.js**:

```bash
#!/bin/bash

echo "🚀 Iniciando deployment..."

# Ir al directorio
cd /var/www/delivery-go-fast/api-server

# Detener PM2
echo "⏸️ Deteniendo PM2..."
pm2 stop delivery-api

# Actualizar código
echo "📥 Actualizando código..."
git pull origin main

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Compilar
echo "🔨 Compilando proyecto..."
npm run build

# Verificar que dist/src/main.js existe
if [ ! -f "dist/src/main.js" ]; then
    echo "❌ ERROR: dist/src/main.js no se creó"
    exit 1
fi

echo "✅ Archivo dist/src/main.js encontrado"

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

## 🔍 Verificación

### Verificar estructura después del build:

```bash
# Ver estructura de dist/
tree dist/ -L 2

# O manualmente:
ls -la dist/
ls -la dist/src/
```

**Debe mostrar**:

```
dist/
├── check-delivery-type.js
├── migrate-delivery-type.js
└── src/
    ├── main.js          ← AQUÍ
    ├── app.module.js
    └── ... (otros archivos)
```

### Test local:

```bash
# En local
cd c:\laragon\www\delivery-go-fast\api-server
npm run build
node dist/src/main.js

# Debe iniciar el servidor
# [Nest] Starting Nest application...
```

### Test en VPS:

```bash
# En VPS
cd /var/www/delivery-go-fast/api-server
npm run build
node dist/src/main.js

# Ctrl+C para detener
# Luego iniciar con PM2:
pm2 start dist/src/main.js --name delivery-api
```

## ✅ Resumen

**El problema**: `main.js` está en `dist/src/main.js`, no en `dist/main.js`

**Causa**: Archivos `.ts` en la raíz del proyecto

**Solución recomendada**: Usar `pm2 start dist/src/main.js`

**Comandos para VPS**:

```bash
pm2 stop delivery-api
pm2 delete delivery-api
npm run build
pm2 start dist/src/main.js --name delivery-api
pm2 save
```

**Comando para local**:

```bash
npm run build
node dist/src/main.js
```

---

**Estado**: ✅ PROBLEMA IDENTIFICADO Y SOLUCIONADO  
**Causa**: Estructura de carpetas en dist/  
**Solución**: Usar ruta correcta `dist/src/main.js`
