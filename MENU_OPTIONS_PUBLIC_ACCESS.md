# Acceso Público a Opciones de Menú

## Problema Identificado

Los clientes y usuarios no autenticados no podían ver las opciones de los items del menú (grupos de opciones) al intentar hacer un pedido. Esto sucedía porque el endpoint estaba protegido con guards de autenticación y roles.

## Solución Implementada

Se modificó el controlador `menu-option-groups.controller.ts` para hacer público el endpoint GET que lista los grupos de opciones.

### Cambios Realizados

**Archivo:** `api-server/src/restaurants/controllers/menu-option-groups.controller.ts`

#### Antes:

```typescript
@Controller("restaurants/:restaurantId/menu-option-groups")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.RESTAURANT_OWNER)
export class MenuOptionGroupsController {
  @Get()
  list(@Param("restaurantId") restaurantId: string) {
    return this.service.list(restaurantId);
  }
  // ... otros métodos
}
```

#### Después:

```typescript
@Controller('restaurants/:restaurantId/menu-option-groups')
export class MenuOptionGroupsController {
  // Endpoint público - Los clientes necesitan ver las opciones
  @Get()
  list(@Param('restaurantId') restaurantId: string) {
    return this.service.list(restaurantId);
  }

  // Todos los demás métodos mantienen guards
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.RESTAURANT_OWNER)
  create(...) { ... }

  // ... etc
}
```

### Endpoints Públicos vs Protegidos

#### Públicos (sin autenticación):

- `GET /restaurants/:restaurantId/menu-option-groups` - Listar grupos de opciones

#### Protegidos (requieren autenticación + rol admin/owner):

- `POST /restaurants/:restaurantId/menu-option-groups` - Crear grupo
- `POST /restaurants/:restaurantId/menu-option-groups/:groupId/options` - Agregar opción
- `PATCH /restaurants/:restaurantId/menu-option-groups/:groupId/options/:optionId` - Actualizar opción
- `DELETE /restaurants/:restaurantId/menu-option-groups/:groupId/options/:optionId` - Eliminar opción
- `PATCH /restaurants/:restaurantId/menu-option-groups/:groupId` - Actualizar grupo
- `DELETE /restaurants/:restaurantId/menu-option-groups/:groupId` - Eliminar grupo
- `POST /restaurants/:restaurantId/menu-option-groups/:groupId/attach/:menuItemId` - Asociar
- `POST /restaurants/:restaurantId/menu-option-groups/:groupId/detach/:menuItemId` - Desasociar

## Impacto

✅ Los clientes ahora pueden ver las opciones de los items al hacer pedidos
✅ Las operaciones administrativas siguen protegidas
✅ No se compromete la seguridad del sistema
✅ Mejora la experiencia de usuario

## Pruebas

Para probar el cambio:

1. **Como usuario no autenticado:**

   ```bash
   curl http://localhost:3000/restaurants/1/menu-option-groups
   ```

   Debería retornar los grupos de opciones sin error 401/403

2. **Como cliente autenticado:**

   - Navegar a un item del menú
   - Las opciones (tamaños, extras, etc.) ahora son visibles
   - Puede seleccionar opciones y agregar al carrito

3. **Como super_admin:**
   - Todas las funcionalidades administrativas siguen funcionando
   - Puede crear, editar y eliminar grupos y opciones

## Fecha de Implementación

31 de octubre de 2025
