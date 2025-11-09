# 🔄 Guía Completa: Reset Total de Base de Datos

**Fecha**: 8 de noviembre de 2025  
**Objetivo**: Eliminar completamente la base de datos y reinstalar todo desde cero

---

## ⚠️ ADVERTENCIA

Esta guía **ELIMINARÁ TODOS LOS DATOS** de la base de datos. Solo ejecuta esto si:

- ✅ Estás en desarrollo
- ✅ No tienes datos importantes
- ✅ Quieres empezar desde cero

---

## 📋 Paso a Paso Completo

### 🗑️ FASE 1: Eliminar Todo

#### Paso 1.1: Detener el Backend

```powershell
# Si tienes el backend corriendo, detenerlo
# Presiona Ctrl+C en la terminal donde corre el backend
```

#### Paso 1.2: Detener y Eliminar Contenedor Docker

```powershell
# Ir a la carpeta del proyecto
cd C:\laragon\www\delivery-go-fast\api-server

# Detener contenedores
docker-compose down

# Eliminar contenedores, volúmenes y redes
docker-compose down -v

# Verificar que no queden contenedores
docker ps -a

# Si aún aparece postgres, eliminarlo manualmente
docker rm -f delivery-postgres
```

#### Paso 1.3: Eliminar Volúmenes de Datos

```powershell
# Listar volúmenes
docker volume ls

# Eliminar volumen de postgres (ajusta el nombre si es diferente)
docker volume rm api-server_postgres_data

# O eliminar todos los volúmenes no usados
docker volume prune -f
```

#### Paso 1.4: Verificar que Todo se Eliminó

```powershell
# No debe aparecer ningún contenedor
docker ps -a

# No debe aparecer el volumen
docker volume ls | Select-String postgres
```

---

### 🆕 FASE 2: Crear Base de Datos Nueva

#### Paso 2.1: Levantar Contenedor Docker

```powershell
cd C:\laragon\www\delivery-go-fast\api-server

# Levantar postgres en modo detached
docker-compose up -d

# Esperar 10 segundos para que postgres inicie
Start-Sleep -Seconds 10

# Verificar que está corriendo
docker ps
```

**Salida esperada**:

```
CONTAINER ID   IMAGE           STATUS          PORTS
abc123def456   postgres:15     Up 5 seconds    0.0.0.0:5434->5432/tcp
```

#### Paso 2.2: Verificar Conexión a Base de Datos

```powershell
# Probar conexión con psql (si tienes psql instalado)
docker exec -it delivery-postgres psql -U delivery_user -d delivery_db

# Dentro de psql, verificar que está vacía:
\dt

# Debe decir: "No relations found."

# Salir de psql
\q
```

---

### 🗄️ FASE 3: Ejecutar Migraciones

#### Paso 3.1: Verificar Estado de Migraciones

```powershell
cd C:\laragon\www\delivery-go-fast\api-server

# Ver migraciones pendientes
npm run migration:show
```

**Salida esperada**:

```
[ ] AddAddressTypeAndDefault1234567890123
[ ] AddIsActiveToMenuItems1730357400000
[ ] PostgisSetup1730600000000
[ ] AddImageUrlFromSql1730600001000
[ ] RunAddAddressTypeAndDefaultSql1730600002000
[ ] AddPrepTimeFields1730600003000
[ ] AddCityToRestaurants1730600004000
[ ] UpdateCityToEnum1730600005000
[ ] FixUpdateTrigger1730772000000
[ ] CreatePaymentTables1730860000000
[ ] AddPhoneAuthFields1731024000000
```

Todos deben tener `[ ]` (sin ejecutar).

#### Paso 3.2: Ejecutar Todas las Migraciones

```powershell
# Ejecutar migraciones TypeScript
npm run migration:run:ts
```

**Salida esperada**:

```
query: SELECT * FROM "information_schema"."tables" WHERE "table_schema" = current_schema() AND "table_name" = 'migrations'
query: CREATE TABLE "migrations" (...)
query: SELECT * FROM "migrations" "migrations" ORDER BY "id" DESC
Migration AddAddressTypeAndDefault1234567890123 has been executed successfully.
Migration AddIsActiveToMenuItems1730357400000 has been executed successfully.
Migration PostgisSetup1730600000000 has been executed successfully.
Migration AddImageUrlFromSql1730600001000 has been executed successfully.
Migration RunAddAddressTypeAndDefaultSql1730600002000 has been executed successfully.
Migration AddPrepTimeFields1730600003000 has been executed successfully.
Migration AddCityToRestaurants1730600004000 has been executed successfully.
Migration UpdateCityToEnum1730600005000 has been executed successfully.
Migration FixUpdateTrigger1730772000000 has been executed successfully.
Migration CreatePaymentTables1730860000000 has been executed successfully.
Migration AddPhoneAuthFields1731024000000 has been executed successfully.
```

#### Paso 3.3: Verificar que se Ejecutaron

```powershell
npm run migration:show
```

**Salida esperada**:

```
[X] AddAddressTypeAndDefault1234567890123
[X] AddIsActiveToMenuItems1730357400000
[X] PostgisSetup1730600000000
[X] AddImageUrlFromSql1730600001000
[X] RunAddAddressTypeAndDefaultSql1730600002000
[X] AddPrepTimeFields1730600003000
[X] AddCityToRestaurants1730600004000
[X] UpdateCityToEnum1730600005000
[X] FixUpdateTrigger1730772000000
[X] CreatePaymentTables1730860000000
[X] AddPhoneAuthFields1731024000000
```

Todos deben tener `[X]` (ejecutadas).

---

### 🔍 FASE 4: Verificar Tablas Creadas

#### Paso 4.1: Listar Todas las Tablas

```powershell
# Conectar a postgres
docker exec -it delivery-postgres psql -U delivery_user -d delivery_db

# Dentro de psql, listar tablas:
\dt
```

**Tablas esperadas**:

```
Schema |           Name            | Type  |    Owner
--------+---------------------------+-------+--------------
public | addresses                 | table | delivery_user
public | menu_categories           | table | delivery_user
public | menu_items                | table | delivery_user
public | migrations                | table | delivery_user
public | order_items               | table | delivery_user
public | orders                    | table | delivery_user
public | payment_methods           | table | delivery_user
public | payments                  | table | delivery_user
public | restaurant_categories     | table | delivery_user
public | restaurants               | table | delivery_user
public | roles                     | table | delivery_user
public | users                     | table | delivery_user
```

#### Paso 4.2: Verificar Extensión PostGIS

```sql
-- Dentro de psql
SELECT postgis_version();
```

**Salida esperada**:

```
3.3.2 USE_GEOS=1 USE_PROJ=1 USE_STATS=1
```

#### Paso 4.3: Verificar Roles

```sql
-- Verificar que existen roles
SELECT id, name FROM roles;
```

**Salida esperada**:

```
 id |       name
----+------------------
  1 | super_admin
  2 | client
  3 | driver
  4 | restaurant_owner
```

#### Paso 4.4: Salir de psql

```sql
\q
```

---

### 🚀 FASE 5: Iniciar Backend

#### Paso 5.1: Compilar Backend

```powershell
cd C:\laragon\www\delivery-go-fast\api-server

# Limpiar y compilar
npm run build
```

#### Paso 5.2: Iniciar en Modo Desarrollo

```powershell
npm run start:dev
```

**Salida esperada**:

```
[Nest] 12345  - 11/08/2025, 5:00:00 PM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 11/08/2025, 5:00:01 PM     LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 12345  - 11/08/2025, 5:00:01 PM     LOG [InstanceLoader] TypeOrmModule dependencies initialized
[Nest] 12345  - 11/08/2025, 5:00:02 PM     LOG [RoutesResolver] AppController {/}:
[Nest] 12345  - 11/08/2025, 5:00:02 PM     LOG [RouterExplorer] Mapped {/, GET} route
[Nest] 12345  - 11/08/2025, 5:00:02 PM     LOG [NestApplication] Nest application successfully started
[Nest] 12345  - 11/08/2025, 5:00:02 PM     LOG Application running on: http://localhost:3000
```

---

### 👤 FASE 6: Crear Super Admin Inicial

#### Paso 6.1: Crear Super Admin

Abre otra terminal PowerShell:

```powershell
# Método 1: Con curl (si tienes curl instalado)
curl -X POST http://localhost:3000/auth/create-super-admin `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"Admin\",\"email\":\"admin@delivery.com\",\"password\":\"Admin123!\"}'

# Método 2: Con Invoke-RestMethod
$body = @{
    name = "Admin"
    email = "admin@delivery.com"
    password = "Admin123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/auth/create-super-admin" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

**Salida esperada**:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "name": "Admin",
    "email": "admin@delivery.com",
    "role": {
      "id": 1,
      "name": "super_admin"
    }
  }
}
```

---

### ✅ FASE 7: Verificación Final

#### Paso 7.1: Verificar que el Backend Responde

```powershell
# Probar endpoint raíz
curl http://localhost:3000

# Probar endpoint de health (si existe)
curl http://localhost:3000/health
```

#### Paso 7.2: Verificar Autenticación

```powershell
# Login con el super admin
$loginBody = @{
    email = "admin@delivery.com"
    password = "Admin123!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $loginBody

# Debe retornar tokens
$response
```

#### Paso 7.3: Iniciar Frontend

```powershell
# Nueva terminal
cd C:\laragon\www\delivery-go-fast\delivery-frontend

# Iniciar servidor de desarrollo
npm start

# O con ionic
ionic serve
```

**URL esperada**: http://localhost:8100

#### Paso 7.4: Probar Login en Frontend

1. Abre: http://localhost:8100
2. Ve a Login
3. Ingresa:
   - Email: `admin@delivery.com`
   - Password: `Admin123!`
4. ✅ Debe iniciar sesión correctamente

---

## 🎯 Checklist Final

Marca cada paso cuando lo completes:

### Base de Datos

- [ ] Contenedor Docker detenido y eliminado
- [ ] Volúmenes eliminados
- [ ] Contenedor nuevo levantado
- [ ] Conexión a postgres exitosa
- [ ] Base de datos vacía confirmada

### Migraciones

- [ ] Estado de migraciones verificado (todas pendientes)
- [ ] Migraciones ejecutadas exitosamente
- [ ] Todas las tablas creadas (12 tablas)
- [ ] PostGIS instalado y funcionando
- [ ] Roles creados (4 roles)

### Backend

- [ ] Backend compilado sin errores
- [ ] Backend iniciado correctamente
- [ ] Super admin creado
- [ ] Login funciona con super admin
- [ ] Endpoints responden

### Frontend

- [ ] Frontend iniciado en localhost:8100
- [ ] Login funciona en la UI
- [ ] No hay errores en consola

---

## 🐛 Troubleshooting

### Problema: "relation does not exist"

**Causa**: Las migraciones no se ejecutaron correctamente.

**Solución**:

```powershell
# Revertir todas las migraciones
npm run migration:revert

# Ejecutar de nuevo
npm run migration:run:ts
```

### Problema: "Cannot find module"

**Causa**: Imports con rutas absolutas en lugar de relativas.

**Solución**:

```powershell
# Ya fue corregido, pero si aparece de nuevo:
# Buscar: from 'src/...
# Reemplazar: from '../../...
```

### Problema: Docker no inicia

**Causa**: Puerto 5434 ocupado.

**Solución**:

```powershell
# Ver qué usa el puerto
netstat -ano | findstr :5434

# Matar proceso (reemplaza PID)
taskkill /PID <PID> /F

# O cambiar puerto en docker-compose.yml
```

### Problema: "password authentication failed"

**Causa**: Credenciales incorrectas en `.env`

**Solución**:

```powershell
# Verificar .env
cat .env | Select-String DB_

# Deben coincidir con docker-compose.yml
```

---

## 📊 Comandos de Referencia Rápida

```powershell
# Reset completo (CUIDADO: Borra todo)
cd api-server
docker-compose down -v
docker-compose up -d
Start-Sleep 10
npm run migration:run:ts
npm run start:dev

# Verificar estado
docker ps
docker exec -it delivery-postgres psql -U delivery_user -d delivery_db -c "\dt"
npm run migration:show

# Crear super admin
curl -X POST http://localhost:3000/auth/create-super-admin `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"Admin\",\"email\":\"admin@delivery.com\",\"password\":\"Admin123!\"}'
```

---

## 📝 Notas Importantes

1. **Backup**: Si tienes datos importantes, haz backup antes de ejecutar esta guía
2. **Tiempo**: El proceso completo toma ~5 minutos
3. **Orden**: Sigue los pasos EN ORDEN, no te saltes ninguno
4. **Errores**: Si algo falla, lee el mensaje de error completo antes de continuar
5. **Logs**: Guarda los logs si necesitas ayuda

---

## ✅ ¿Qué hacer después?

Después de completar esta guía:

1. ✅ Puedes crear usuarios de prueba
2. ✅ Puedes crear restaurantes
3. ✅ Puedes probar el sistema completo
4. ✅ La base de datos está limpia y lista para desarrollo

---

**Última actualización**: 8 de noviembre de 2025  
**Estado**: ✅ Lista para usar  
**Próximo paso**: Ejecutar FASE 1 - Eliminar Todo
