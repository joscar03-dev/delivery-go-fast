# Implementación de columna `isActive` para Restaurantes y Usuarios

## 📋 Resumen

Se ha agregado la columna `isActive` tanto a restaurantes como a usuarios para permitir activar/desactivar entidades sin eliminarlas de la base de datos.

## 🗄️ Cambios en Base de Datos

### Migración creada:

- **Archivo**: `1731533000000-AddIsActiveToRestaurantsAndUsers.ts`
- **Columnas agregadas**:
  - `restaurants.is_active` (BOOLEAN, default: `true`)
  - `users.is_active` (BOOLEAN, default: `true`)
- **Índices creados**:
  - `idx_restaurants_is_active`
  - `idx_users_is_active`

### Para ejecutar la migración:

```bash
cd api-server
npm run migration:run
```

### Para revertir la migración:

```bash
npm run migration:revert
```

---

## 🏢 Cambios en RESTAURANTES

### 1. Entidad actualizada

**Archivo**: `api-server/src/restaurants/entities/restaurant.entity.ts`

```typescript
@Column({ name: 'is_active', type: 'boolean', default: true })
isActive: boolean;
```

### 2. Service - Nuevos métodos

**Archivo**: `api-server/src/restaurants/restaurants.service.ts`

#### Métodos modificados:

- ✅ `findAll()` - Ahora solo retorna restaurantes activos
- ✅ `findNearby()` - Filtra por `isActive = true`

#### Métodos nuevos:

```typescript
// Activar/desactivar restaurante
async toggleActive(id: string, isActive: boolean): Promise<Restaurant>

// Obtener todos los restaurantes (incluyendo inactivos) - Solo admin
async findAllForAdmin(): Promise<Restaurant[]>
```

### 3. Controller - Nuevos endpoints

**Archivo**: `api-server/src/restaurants/restaurants.controller.ts`

#### Endpoints nuevos:

1. **Activar/desactivar restaurante** (Solo SUPER_ADMIN)

```http
PATCH /restaurants/:id/toggle-active
Body: { "isActive": true/false }
```

2. **Listar todos los restaurantes incluyendo inactivos** (Solo SUPER_ADMIN)

```http
GET /restaurants/admin/all
```

---

## 👤 Cambios en USUARIOS

### 1. Entidad actualizada

**Archivo**: `api-server/src/users/entities/user.entity.ts`

```typescript
@Column({ name: 'is_active', type: 'boolean', default: true })
@Index('idx_users_is_active')
isActive: boolean;
```

### 2. Service - Nuevos métodos

**Archivo**: `api-server/src/users/users.service.ts`

#### Métodos nuevos:

```typescript
// Activar/desactivar usuario
async toggleActive(id: string, isActive: boolean): Promise<User>

// Obtener todos los usuarios (incluyendo inactivos) - Solo admin
async findAllForAdmin(): Promise<User[]>
```

### 3. Auth Service - Validación de usuarios activos

**Archivo**: `api-server/src/auth/auth.service.ts`

#### Métodos modificados:

- ✅ `login()` - Valida que el usuario esté activo
- ✅ `loginWithPhone()` - Valida que el usuario esté activo

**Mensaje de error**:

```
"Usuario desactivado. Contacta al administrador."
```

### 4. Controller - Nuevos endpoints

**Archivo**: `api-server/src/users/users.controller.ts`

#### Endpoints nuevos:

1. **Activar/desactivar usuario** (Solo SUPER_ADMIN)

```http
PATCH /users/:id/toggle-active
Body: { "isActive": true/false }
```

2. **Listar todos los usuarios incluyendo inactivos** (Solo SUPER_ADMIN)

```http
GET /users/admin/all
```

---

## 🎯 Impactos y Comportamiento

### Para RESTAURANTES inactivos (`isActive = false`):

#### ✅ Lo que SÍ sucede:

1. **No aparecen en listados públicos**

   - `GET /restaurants` no los incluye
   - `GET /restaurants?latitude=X&longitude=Y` no los incluye

2. **Pueden ser visualizados por admin**

   - `GET /restaurants/admin/all` los incluye

3. **El dueño puede acceder a su dashboard**
   - `GET /restaurants/:id/dashboard` funciona normal

#### ⚠️ Lo que NO se bloquea automáticamente:

- Pedidos nuevos al restaurante (necesitas validación adicional)
- Acceso directo por ID: `GET /restaurants/:id`
- Edición del restaurante por el dueño

#### 📝 Recomendaciones adicionales:

```typescript
// En orders.service.ts al crear pedido:
const restaurant = await this.restaurantsService.findOne(restaurantId);
if (!restaurant.isActive) {
  throw new BadRequestException("El restaurante no está disponible");
}
```

---

### Para USUARIOS inactivos (`isActive = false`):

#### ✅ Lo que SÍ sucede:

1. **No pueden hacer login**

   - Tanto por email/password
   - Como por teléfono/OTP
   - Mensaje: "Usuario desactivado. Contacta al administrador."

2. **Repartidores desactivados**
   - Ya no aparecen en `GET /users/drivers/available`

#### ⚠️ Lo que NO se bloquea automáticamente:

- Si ya tiene un token JWT válido, puede seguir usándolo
- Pedidos activos asignados al usuario/repartidor

#### 📝 Recomendaciones adicionales:

```typescript
// Agregar Guard personalizado para validar isActive:
@Injectable()
export class ActiveUserGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = await this.usersService.findOne(request.user.sub);

    if (!user.isActive) {
      throw new UnauthorizedException("Usuario desactivado");
    }

    return true;
  }
}
```

---

## 🚀 Pasos para Implementación

### 1. Ejecutar migración

```bash
cd api-server
npm run migration:run
```

### 2. Verificar columnas creadas

```sql
-- En PostgreSQL:
\d restaurants
\d users
```

### 3. Compilar backend

```bash
npm run build
```

### 4. Reiniciar servidor

```bash
npm run start:dev
```

---

## 🧪 Pruebas Sugeridas

### Para Restaurantes:

```bash
# 1. Listar restaurantes (solo activos)
GET http://localhost:3000/restaurants

# 2. Desactivar restaurante (como super_admin)
PATCH http://localhost:3000/restaurants/{id}/toggle-active
Body: { "isActive": false }

# 3. Verificar que no aparece en listado público
GET http://localhost:3000/restaurants

# 4. Verificar que sí aparece en listado admin
GET http://localhost:3000/restaurants/admin/all
```

### Para Usuarios:

```bash
# 1. Desactivar usuario (como super_admin)
PATCH http://localhost:3000/users/{id}/toggle-active
Body: { "isActive": false }

# 2. Intentar login con ese usuario
POST http://localhost:3000/auth/login
Body: { "identifier": "user@example.com", "password": "123456" }
# Debe retornar: "Usuario desactivado. Contacta al administrador."

# 3. Verificar que aparece en listado admin
GET http://localhost:3000/users/admin/all
```

---

## 📊 Frontend - Cambios Necesarios

### 1. Dashboard Admin - Gestión de Restaurantes

**Archivo sugerido**: `delivery-frontend/src/app/pages/admin/restaurants/restaurants.page.ts`

```typescript
// Agregar botón toggle en cada restaurante
async toggleRestaurantActive(restaurant: any) {
  const newStatus = !restaurant.isActive;

  await this.http.patch(
    `${API_URL}/restaurants/${restaurant.id}/toggle-active`,
    { isActive: newStatus }
  ).toPromise();

  restaurant.isActive = newStatus;

  this.showToast(
    `Restaurante ${newStatus ? 'activado' : 'desactivado'} correctamente`
  );
}
```

### 2. Dashboard Admin - Gestión de Usuarios

**Archivo sugerido**: `delivery-frontend/src/app/pages/admin/users/users.page.ts`

```typescript
// Agregar botón toggle en cada usuario
async toggleUserActive(user: any) {
  const newStatus = !user.isActive;

  await this.http.patch(
    `${API_URL}/users/${user.id}/toggle-active`,
    { isActive: newStatus }
  ).toPromise();

  user.isActive = newStatus;

  this.showToast(
    `Usuario ${newStatus ? 'activado' : 'desactivado'} correctamente`
  );
}
```

### 3. Indicador Visual

```html
<!-- Para restaurantes -->
<ion-badge [color]="restaurant.isActive ? 'success' : 'danger'">
  {{ restaurant.isActive ? 'Activo' : 'Inactivo' }}
</ion-badge>

<!-- Para usuarios -->
<ion-badge [color]="user.isActive ? 'success' : 'danger'">
  {{ user.isActive ? 'Activo' : 'Bloqueado' }}
</ion-badge>
```

---

## 🔒 Seguridad

### Endpoints protegidos:

- ✅ Solo `SUPER_ADMIN` puede activar/desactivar
- ✅ Usuarios normales no pueden cambiar su propio estado
- ✅ Dueños de restaurante no pueden cambiar estado de su restaurante

### Validaciones:

- ✅ Login bloqueado para usuarios inactivos
- ✅ Listados públicos filtran por activos
- ✅ Admins pueden ver todos los registros

---

## 📝 Notas Adicionales

### Valores por defecto:

- Todos los registros existentes tendrán `isActive = true` por defecto
- Nuevos registros también serán activos por defecto

### Diferencia con `deleted_at`:

- `isActive` es para **desactivación temporal** (reversible)
- `deleted_at` (soft delete) es para **eliminación lógica** (más permanente)
- Ambos métodos son válidos según el caso de uso

### Consideraciones futuras:

1. **Historial de cambios**: Registrar quién y cuándo desactivó
2. **Notificaciones**: Avisar al dueño cuando su restaurante es desactivado
3. **Pedidos activos**: Definir qué hacer con pedidos en curso
4. **Reactivación automática**: Permitir que dueños soliciten reactivación

---

---

## 🛡️ VALIDACIONES ADICIONALES IMPLEMENTADAS

### ✅ Guards Personalizados Creados

#### 1. **ActiveUserGuard**

**Archivo**: `api-server/src/auth/guards/active-user.guard.ts`

- Valida que el usuario autenticado esté activo en CADA petición
- Se usa DESPUÉS de `JwtAuthGuard`
- Invalida tokens JWT de usuarios desactivados
- Mensaje: _"Tu cuenta ha sido desactivada. Contacta al administrador."_

**Uso**:

```typescript
@UseGuards(JwtAuthGuard, ActiveUserGuard, RolesGuard)
```

#### 2. **ActiveRestaurantGuard**

**Archivo**: `api-server/src/restaurants/guards/active-restaurant.guard.ts`

- Valida que el restaurante esté activo antes de permitir acceso
- Extrae `restaurantId` de los params
- Mensaje: _"El restaurante no está disponible en este momento"_

**Aplicado en**:

- `GET /restaurants/:id` - Ver detalle de restaurante
- `GET /restaurants/:id/menu` - Ver menú del restaurante

---

### 🔒 Validaciones en Endpoints Críticos

#### **Pedidos (Orders)**

**1. Crear Pedido**

```typescript
// orders.service.ts - create()
if (!restaurant.isActive) {
  throw new BadRequestException(
    "El restaurante no está disponible en este momento"
  );
}
```

**2. Asignar Repartidor**

```typescript
// orders.service.ts - assignDriver()
if (!driver.isActive) {
  throw new BadRequestException(
    "El repartidor no está disponible en este momento"
  );
}
```

**3. Asignar Repartidor de Restaurante**

```typescript
// orders.service.ts - assignRestaurantDriver()
if (!driver.isActive) {
  throw new BadRequestException(
    "El repartidor no está disponible en este momento"
  );
}
```

**4. Controller con ActiveUserGuard**

```typescript
@Controller('orders')
@UseGuards(JwtAuthGuard, ActiveUserGuard, RolesGuard)
export class OrdersController
```

- Todos los endpoints de orders ahora validan usuario activo

---

#### **Restaurantes**

**1. Listados públicos filtran por activos**

```typescript
// restaurants.service.ts - findAll()
where: { isActive: true }

// restaurants.service.ts - findNearby()
.andWhere('restaurant.is_active = :isActive', { isActive: true })
```

**2. Acceso por ID requiere restaurante activo**

```typescript
@Get(':id')
@UseGuards(ActiveRestaurantGuard)
findOne(@Param('id') id: string)
```

---

#### **Usuarios/Repartidores**

**1. Listado de drivers disponibles**

```typescript
// users.service.ts - findAllDrivers()
where: {
  role: { name: RoleEnum.DRIVER },
  isActive: true
}
```

- Solo retorna repartidores activos

**2. Login bloqueado**

```typescript
// auth.service.ts - login()
if (!user.isActive) {
  throw new UnauthorizedException(
    "Usuario desactivado. Contacta al administrador."
  );
}

// auth.service.ts - loginWithPhone()
if (!user.isActive) {
  throw new UnauthorizedException(
    "Usuario desactivado. Contacta al administrador."
  );
}
```

---

### 📦 Módulos Actualizados

#### **AuthModule**

```typescript
providers: [..., ActiveUserGuard],
exports: [ActiveUserGuard]
```

#### **RestaurantsModule**

```typescript
providers: [..., ActiveRestaurantGuard],
exports: [ActiveRestaurantGuard]
```

#### **OrdersModule**

```typescript
imports: [..., AuthModule],
// Permite usar ActiveUserGuard
```

---

## 🎯 Flujo Completo de Validación

### **Escenario 1: Usuario desactivado intenta hacer pedido**

1. ✅ Usuario tiene token JWT válido (no expirado)
2. ❌ `ActiveUserGuard` verifica en BD: `isActive = false`
3. 🚫 **BLOQUEADO** - Error 401: _"Tu cuenta ha sido desactivada"_

**Antes**: Usuario podía seguir usando su token hasta expiración  
**Ahora**: Validación en tiempo real en cada petición

---

### **Escenario 2: Restaurante desactivado**

#### **Intento de crear pedido**

1. Cliente intenta crear pedido
2. ✅ `orders.service.create()` valida `restaurant.isActive`
3. 🚫 **BLOQUEADO** - Error 400: _"El restaurante no está disponible"_

#### **Intento de acceso directo**

1. Usuario intenta `GET /restaurants/:id`
2. ✅ `ActiveRestaurantGuard` valida `isActive`
3. 🚫 **BLOQUEADO** - Error 403: _"El restaurante no está disponible"_

#### **Listado público**

1. Usuario solicita `GET /restaurants`
2. ✅ Service filtra: `where: { isActive: true }`
3. ✅ **Solo muestra activos** - Restaurante inactivo no aparece

---

### **Escenario 3: Repartidor desactivado**

#### **Asignación de pedido**

1. Admin intenta asignar pedido a repartidor
2. ✅ `assignDriver()` valida `driver.isActive`
3. 🚫 **BLOQUEADO** - Error 400: _"El repartidor no está disponible"_

#### **Listado de disponibles**

1. Sistema solicita `GET /users/drivers/available`
2. ✅ Service filtra: `where: { isActive: true, role: 'DRIVER' }`
3. ✅ **Solo muestra activos** - Repartidor inactivo no aparece

---

## 📊 Resumen de Protecciones

| Endpoint/Acción                   | Guard/Validación        | Mensaje de Error                                 |
| --------------------------------- | ----------------------- | ------------------------------------------------ |
| **Todos los endpoints de Orders** | `ActiveUserGuard`       | "Tu cuenta ha sido desactivada"                  |
| **Login (email/phone)**           | Validación en service   | "Usuario desactivado. Contacta al administrador" |
| **GET /restaurants (listado)**    | Filtro en query         | (No aparecen inactivos)                          |
| **GET /restaurants/:id**          | `ActiveRestaurantGuard` | "El restaurante no está disponible"              |
| **POST /orders**                  | Validación en service   | "El restaurante no está disponible"              |
| **Asignar driver**                | Validación en service   | "El repartidor no está disponible"               |
| **GET /users/drivers/available**  | Filtro en query         | (No aparecen inactivos)                          |

---

## ✅ Checklist de Verificación

- [x] Migración creada
- [x] Entidades actualizadas
- [x] Services modificados
- [x] Controllers actualizados
- [x] Auth service valida usuarios activos (login)
- [x] **ActiveUserGuard creado y aplicado**
- [x] **ActiveRestaurantGuard creado y aplicado**
- [x] **Validación en crear pedido (restaurante activo)**
- [x] **Validación en asignar driver (driver activo)**
- [x] **Filtros en listados (solo activos)**
- [x] Índices de BD creados
- [x] Backend compila correctamente
- [ ] Migración ejecutada en BD
- [ ] Pruebas manuales realizadas
- [ ] Frontend actualizado (pendiente)
- [ ] Dashboard admin implementado (pendiente)

---

**Fecha de implementación**: 13 de noviembre de 2025  
**Autor**: Sistema de migraciones automáticas  
**Versión**: 2.0.0 (Con validaciones completas)  
**Última actualización**: 13/11/2025 - Guards y validaciones adicionales
