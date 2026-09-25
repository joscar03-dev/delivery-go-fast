# Bootstrap de la base de datos

Este es el **único** mecanismo para dejar la base de datos lista para operar. Reemplaza
al antiguo flujo de crear el super admin por HTTP.

> Antes se usaba `POST /auth/create-super-admin`. Ese endpoint (y sus hermanos
> `/auth/create-driver` y `/auth/create-restaurant-owner`) ya no existen porque eran
> públicos: cualquiera que alcanzara la API podía convertirse en super admin.

## Qué hace

Un solo comando, **idempotente** (se puede ejecutar las veces que haga falta sin
duplicar nada):

1. Crea los 4 roles si faltan: `client`, `driver`, `restaurant_owner`, `super_admin`
2. Crea el **super admin inicial** solo si la base todavía no tiene ninguno
3. Sincroniza los métodos de pago: `cash`, `yape`, `plin`, `card`
4. Inserta las 8 categorías de restaurante por defecto, únicamente si la tabla está vacía

## Uso

1. Define las credenciales del super admin en `api-server/.env`:

   ```env
   BOOTSTRAP_ADMIN_NAME=Administrador
   BOOTSTRAP_ADMIN_EMAIL=admin@delivery.com
   BOOTSTRAP_ADMIN_PASSWORD=Admin123!
   ```

   La contraseña debe tener al menos 8 caracteres.

2. Ejecuta el bootstrap:

   ```bash
   cd api-server
   npm run seed:bootstrap
   ```

3. Inicia sesión con esas credenciales. El login pide `identifier` (email o teléfono E.164),
   no `email`:

   ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"identifier":"admin@delivery.com","password":"Admin123!"}'
   ```

## Comportamiento al re-ejecutarlo

| Paso | Si ya existe |
|---|---|
| Roles | No hace nada, los deja como están |
| Super admin | **No crea otro**, no reinicia contraseñas |
| Métodos de pago | Actualiza nombre, descripción y estado activo |
| Categorías | No inserta nada si ya hay al menos una |

## Después del bootstrap: operación diaria

Las variables `BOOTSTRAP_ADMIN_*` solo se necesitan la primera vez. Una vez existe el
super admin puedes borrarlas del `.env`.

Para gestionar usuarios usa la colección de Postman en `api-server/postman/`:

1. Importa `GoFast.collection.json` y el entorno `GoFast.local.postman_environment.json`
2. Ejecuta **Login (guarda los tokens)** — el test script guarda `accessToken` y
   `refreshToken` en el entorno
3. Usa el resto de requests, que ya llevan el `Bearer {{accessToken}}`

Para crear usuarios con cualquier rol:

```bash
curl -X POST http://localhost:3000/users \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Repartidor","email":"driver@delivery.com","password":"Driver123!","role":"driver"}'
```

Solo un `super_admin` autenticado puede usar ese endpoint. El registro público
`POST /auth/register` **siempre** crea rol `client`.

## Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `BOOTSTRAP_ADMIN_NAME` | Solo si no hay super admin | Nombre del super admin inicial |
| `BOOTSTRAP_ADMIN_EMAIL` | Solo si no hay super admin | Email del super admin inicial |
| `BOOTSTRAP_ADMIN_PASSWORD` | Solo si no hay super admin | Contraseña, mínimo 8 caracteres |
| `BCRYPT_SALT_ROUNDS` | No | Rondas de bcrypt, default `10` |

## Nota sobre producción

`src/database/data-source.ts` tiene `synchronize: true`, así que el bootstrap también
crea las tablas que falten. En un entorno con datos reales conviene correr migraciones
en lugar de depender de `synchronize`.
