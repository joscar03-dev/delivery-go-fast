# 🔧 Fix: Trigger update_modified_column

## Problema

El trigger `update_modified_column()` en PostgreSQL está usando `updatedAt` (camelCase) cuando la columna en la base de datos se llama `updated_at` (snake_case).

**Error:**

```
QueryFailedError: record "new" has no field "updatedAt"
PL/pgSQL function update_modified_column() line 3 at assignment
```

## Solución

Esta migración corrige el trigger para usar el nombre correcto de columna.

## Ejecución

### Desarrollo (Local)

```bash
# Desde la carpeta api-server
npm run migration:run
```

### Producción

```bash
# 1. Hacer deploy del código con la migración
git push origin main

# 2. En el servidor, ejecutar:
cd api-server
npm run migration:run

# 3. Verificar que se aplicó correctamente:
npm run migration:show
```

## Verificación

Para verificar que el trigger se corrigió:

```sql
-- Ver el código de la función
SELECT prosrc
FROM pg_proc
WHERE proname = 'update_modified_column';

-- Debe retornar:
-- NEW.updated_at = CURRENT_TIMESTAMP;
-- (no "NEW.updatedAt")
```

## Rollback

Si algo sale mal:

```bash
npm run migration:revert
```

Esto revertirá el trigger a su versión anterior (con el bug).

## Tablas Afectadas

Esta migración actualiza el trigger para las siguientes tablas:

- ✅ `addresses`
- ✅ `users`
- ✅ `restaurants`
- ✅ `menu_items`
- ✅ `orders`
- ✅ `deliveries`

## Scripts NPM

Agrega estos scripts a `package.json` si no existen:

```json
{
  "scripts": {
    "migration:generate": "typeorm migration:generate -d src/database/data-source.ts",
    "migration:create": "typeorm migration:create",
    "migration:run": "typeorm migration:run -d src/database/data-source.ts",
    "migration:revert": "typeorm migration:revert -d src/database/data-source.ts",
    "migration:show": "typeorm migration:show -d src/database/data-source.ts"
  }
}
```

## Notas

- ⚠️ **IMPORTANTE**: Esta migración debe ejecutarse ANTES de cualquier UPDATE en producción
- 🔒 La migración es **idempotente** (se puede ejecutar múltiples veces sin problemas)
- 📊 El trigger se ejecuta automáticamente en cada UPDATE
- ✅ Sin downtime: La migración se ejecuta en milisegundos
