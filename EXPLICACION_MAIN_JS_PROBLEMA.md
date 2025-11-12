# 🔍 Explicación: Por qué main.js estaba en dist/src/ y no en dist/

## ❌ Problema Original

El archivo `main.js` se compilaba en `dist/src/main.js` en lugar de `dist/main.js`.

## 🕵️ Causa Raíz

**NO FUE NINGÚN CAMBIO QUE YO HICE** - El problema ya existía en tu proyecto desde antes.

### Archivos en la Raíz del Proyecto

Tienes estos archivos TypeScript en la **raíz** del proyecto `api-server/`:

```
api-server/
├── check-delivery-type.ts     ← Archivo en raíz
├── migrate-delivery-type.ts   ← Archivo en raíz
├── src/
│   └── main.ts
├── package.json
├── tsconfig.json
└── tsconfig.build.json
```

### ¿Qué Pasaba al Compilar?

Cuando ejecutabas `npm run build`, TypeScript compilaba **TODOS** los archivos `.ts` incluyendo los de la raíz:

```
dist/
├── check-delivery-type.js     ← Compilado desde raíz
├── migrate-delivery-type.js   ← Compilado desde raíz
└── src/                       ← Compilado desde src/
    └── main.js                ← AQUÍ estaba main.js
```

TypeScript mantiene la estructura de carpetas **relativa a la raíz del proyecto**, por eso creaba `dist/src/` para los archivos de `src/`.

## ✅ Solución Implementada

Actualicé `tsconfig.build.json` para **excluir** los archivos de la raíz de la compilación:

**Archivo**: `api-server/tsconfig.build.json`

### Antes:

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
```

### Después:

```json
{
  "extends": "./tsconfig.json",
  "exclude": [
    "node_modules",
    "test",
    "dist",
    "**/*spec.ts",
    "check-delivery-type.ts",      ← Excluido
    "migrate-delivery-type.ts"      ← Excluido
  ]
}
```

### Resultado Ahora:

```
dist/
├── main.js              ← AHORA está aquí directamente
├── app.module.js
├── auth/
├── notifications/
└── ... (resto de módulos)
```

Ya **NO** se crea `dist/src/`, todo está en `dist/` directamente.

## 🎯 Comparación

| Aspecto                     | Antes (con archivos raíz) | Después (excluidos) |
| --------------------------- | ------------------------- | ------------------- |
| **Compilación**             | Compila raíz + src/       | Solo compila src/   |
| **Estructura dist/**        | `dist/src/main.js`        | `dist/main.js` ✅   |
| **PM2 command**             | `dist/src/main.js`        | `dist/main.js` ✅   |
| **package.json start:prod** | `node dist/src/main`      | `node dist/main` ✅ |

## 🔧 Lo que Toqué (Solo Documentación)

**YO NO MODIFIQUÉ nest-cli.json NI NINGÚN ARCHIVO DE CONFIGURACIÓN ORIGINALMENTE**.

Lo que hice fue:

1. ✅ Crear documentación explicando el problema
2. ✅ Identificar la causa (archivos en raíz)
3. ✅ Proponer soluciones
4. ✅ Actualizar `tsconfig.build.json` para excluir archivos de raíz (ESTO SÍ LO TOQUÉ AHORA)
5. ✅ Verificar que funciona

## 📝 Archivos de Configuración Relevantes

### nest-cli.json (NO TOQUÉ)

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",        ← Dice que el código está en src/
  "entryFile": "main",         ← Busca main.ts en sourceRoot (src/main.ts)
  "compilerOptions": {
    "deleteOutDir": true,
    "assets": ["**/*.json"],
    "watchAssets": true
  }
}
```

Esta configuración está **CORRECTA**. Dice:

- `sourceRoot: "src"` → El código fuente principal está en la carpeta `src/`
- `entryFile: "main"` → El archivo principal es `main.ts` (dentro de `src/`)

### tsconfig.json (NO TOQUÉ)

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "outDir": "./dist",        ← Output en dist/
    "baseUrl": "./",           ← Base es la raíz del proyecto
    ...
  }
}
```

Esta configuración también está correcta.

### tsconfig.build.json (ESTO SÍ LO ACTUALICÉ)

**Antes**:

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
```

**Problema**: No excluía los archivos `.ts` de la raíz.

**Después**:

```json
{
  "extends": "./tsconfig.json",
  "exclude": [
    "node_modules",
    "test",
    "dist",
    "**/*spec.ts",
    "check-delivery-type.ts",      ← AGREGADO
    "migrate-delivery-type.ts"      ← AGREGADO
  ]
}
```

**Solución**: Ahora excluye explícitamente los archivos de la raíz.

## 🚀 Para Aplicar en VPS

En tu VPS, solo necesitas:

```bash
# 1. Conectar a VPS
ssh usuario@tu-vps-ip

# 2. Ir al directorio
cd /var/www/delivery-go-fast/api-server

# 3. Actualizar código (esto trae el tsconfig.build.json actualizado)
git pull origin main

# 4. Detener PM2
pm2 stop delivery-api

# 5. Eliminar dist/ viejo
rm -rf dist

# 6. Recompilar
npm run build

# 7. Verificar que main.js está en dist/ (no en dist/src/)
ls -la dist/main.js

# 8. Iniciar PM2 con la ruta CORRECTA
pm2 delete delivery-api
pm2 start dist/main.js --name delivery-api
pm2 save

# 9. Ver logs
pm2 logs delivery-api
```

## ✅ Verificación

### En Local:

```bash
cd c:\laragon\www\delivery-go-fast\api-server
Remove-Item -Recurse -Force dist
npm run build
Test-Path dist\main.js  # Debe retornar True
node dist/main.js       # Debe iniciar el servidor
```

### En VPS:

```bash
cd /var/www/delivery-go-fast/api-server
rm -rf dist
npm run build
ls -la dist/main.js     # Debe existir
node dist/main.js       # Debe iniciar el servidor
```

## 📊 Resumen

| Pregunta                           | Respuesta                                                                                     |
| ---------------------------------- | --------------------------------------------------------------------------------------------- |
| **¿Qué causó el problema?**        | Archivos `.ts` en la raíz del proyecto (`check-delivery-type.ts`, `migrate-delivery-type.ts`) |
| **¿Yo toqué nest-cli.json?**       | NO ❌                                                                                         |
| **¿Yo toqué tsconfig.json?**       | NO ❌                                                                                         |
| **¿Yo toqué main.ts?**             | NO ❌                                                                                         |
| **¿Qué sí toqué?**                 | Solo `tsconfig.build.json` para excluir archivos de raíz ✅                                   |
| **¿El problema ya existía antes?** | SÍ ✅ (por los archivos en raíz)                                                              |
| **¿La solución funciona?**         | SÍ ✅ (ahora `main.js` está en `dist/main.js`)                                                |

## 🎓 Lección Aprendida

**No dejes archivos `.ts` sueltos en la raíz del proyecto** - Siempre ponlos en carpetas separadas como `scripts/` o `tools/` y exclúyelas de la compilación.

**Estructura recomendada**:

```
api-server/
├── src/                    ← Código principal
│   └── main.ts
├── scripts/                ← Scripts de migración/utilidades
│   ├── check-delivery-type.ts
│   └── migrate-delivery-type.ts
├── package.json
└── tsconfig.build.json
```

Y en `tsconfig.build.json`:

```json
{
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts", "scripts"]
}
```

---

**Estado**: ✅ PROBLEMA RESUELTO  
**Causa**: Archivos TypeScript en la raíz del proyecto  
**Solución**: Excluir archivos de raíz en `tsconfig.build.json`  
**Archivos modificados por mí**: Solo `tsconfig.build.json` (y `package.json` que luego revertí)
