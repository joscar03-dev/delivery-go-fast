# Sistema de Direcciones con Tipos y Predeterminadas

## Nuevas Funcionalidades Implementadas

### Backend (API Server)

1. **Tipo de dirección (AddressType)**

   - Enum con valores: `HOME` (casa), `WORK` (trabajo), `OTHER` (otro)
   - Columna `type` en la tabla `addresses`
   - Valor predeterminado: `HOME`

2. **Dirección predeterminada**

   - Campo booleano `isDefault` en la tabla `addresses`
   - Lógica automática: solo una dirección puede ser predeterminada por usuario
   - Al marcar una dirección como predeterminada, las demás se desmarcan automáticamente

3. **Timestamps**
   - `createdAt`: fecha de creación de la dirección
   - `updatedAt`: fecha de última actualización (con trigger automático)

### Frontend (Delivery Frontend)

1. **Selector de tipo de dirección**

   - Dropdown en el formulario de dirección con opciones: Casa, Trabajo, Otro
   - Iconos visuales para cada tipo

2. **Marcar como predeterminada**

   - Toggle en el formulario para marcar una dirección como predeterminada

3. **Selector de dirección en el carrito**

   - Modal que muestra todas las direcciones guardadas
   - Selección mediante radio buttons
   - Badge "Predeterminada" en la dirección marcada
   - Botón "Agregar Nueva Dirección" para crear direcciones inline
   - La dirección seleccionada se muestra en la página del carrito

4. **Tarjeta de dirección en el carrito**
   - Muestra la dirección seleccionada o la predeterminada
   - Botón "Cambiar Dirección" para abrir el selector
   - Validación: no permite completar pedido sin dirección seleccionada

## Migración de Base de Datos

### Opción 1: Ejecutar SQL directamente

```bash
# Desde la raíz del proyecto
cd api-server
psql -U tu_usuario -d delivery_db -f migrations/add-address-type-and-default.sql
```

### Opción 2: Usar el script de migración de Node.js

```bash
cd api-server
node run-migration.js
```

### Opción 3: Ejecutar manualmente desde psql

```sql
-- Conectarse a la base de datos
psql -U tu_usuario -d delivery_db

-- Copiar y pegar el contenido del archivo migrations/add-address-type-and-default.sql
```

## Archivos Modificados/Creados

### Backend

**Nuevos:**

- `src/users/entities/address.entity.ts` - Actualizada con enum AddressType, isDefault, timestamps
- `src/users/dto/create-address.dto.ts` - Agregados campos type y isDefault
- `src/users/dto/update-address.dto.ts` - Agregados campos type y isDefault
- `migrations/add-address-type-and-default.sql` - Script de migración SQL

**Modificados:**

- `src/users/address.service.ts` - Lógica para manejar dirección predeterminada única

### Frontend

**Nuevos:**

- `src/app/components/address-selector/address-selector.component.ts` - Modal para seleccionar dirección
- `src/app/components/address-selector/address-selector.component.html` - Template del selector
- `src/app/components/address-selector/address-selector.component.scss` - Estilos del selector

**Modificados:**

- `src/app/models/address.model.ts` - Agregado enum AddressType y helper functions
- `src/app/components/address-form/address-form.component.ts` - Agregado selector de tipo y toggle predeterminada
- `src/app/components/address-form/address-form.component.html` - UI actualizada con nuevos campos
- `src/app/pages/cart/cart.page.ts` - Integración con selector de direcciones
- `src/app/pages/cart/cart.page.html` - Tarjeta de dirección de entrega
- `src/app/pages/cart/cart.page.scss` - Estilos para tarjeta de dirección

## Uso del Sistema

### 1. Crear una dirección con tipo

**Frontend:**

- Ir a Perfil → Direcciones → Agregar Nueva Dirección
- Seleccionar el tipo: Casa, Trabajo u Otro
- Activar el toggle "Marcar como dirección predeterminada" si se desea
- Completar los demás campos y guardar

**Backend API:**

```typescript
POST /addresses
{
  "street": "Av. Principal 123",
  "city": "Arequipa",
  "postalCode": "04001",
  "reference": "Casa blanca con reja verde",
  "type": "home",  // 'home', 'work', 'other'
  "isDefault": true,
  "latitude": -16.409047,
  "longitude": -71.537451
}
```

### 2. Actualizar una dirección

```typescript
PATCH /addresses/:id
{
  "type": "work",
  "isDefault": true  // Automáticamente desmarca las demás
}
```

### 3. Realizar un pedido con dirección

**En el carrito:**

1. Se carga automáticamente la dirección predeterminada
2. Si no hay predeterminada, se carga la primera dirección disponible
3. El usuario puede cambiar la dirección haciendo clic en "Cambiar Dirección"
4. Al confirmar el pedido, se usa la dirección seleccionada

## Helpers para el Template

En `address.model.ts`:

```typescript
// Obtener etiqueta en español
getAddressTypeLabel(type: AddressType): string
// Retorna: 'Casa', 'Trabajo', 'Otro'

// Obtener icono de Ionic
getAddressTypeIcon(type: AddressType): string
// Retorna: 'home-outline', 'briefcase-outline', 'location-outline'
```

## Validaciones

### Backend

- `type` debe ser uno de: 'home', 'work', 'other'
- `isDefault` debe ser booleano
- Solo una dirección puede ser predeterminada por usuario (validación automática)

### Frontend

- No se puede completar un pedido sin seleccionar una dirección
- El formulario valida todos los campos requeridos
- El selector muestra claramente cuál es la dirección predeterminada

## Próximos Pasos Sugeridos

1. **Testing:**

   - Crear direcciones de diferentes tipos
   - Probar cambiar la dirección predeterminada
   - Verificar que solo una dirección quede como predeterminada
   - Probar el flujo completo de checkout con selección de dirección

2. **Mejoras opcionales:**
   - Agregar confirmación antes de cambiar dirección predeterminada
   - Agregar búsqueda de direcciones en el selector
   - Implementar geocodificación automática al ingresar dirección
   - Agregar vista de mapa en el selector de direcciones

## Troubleshooting

### Error: Column 'type' does not exist

**Solución:** Ejecutar la migración SQL

### Error: Cannot set multiple default addresses

**Solución:** La lógica del backend maneja esto automáticamente, verificar que el servicio esté implementado correctamente

### Modal no se abre al hacer clic en "Cambiar Dirección"

**Solución:** Verificar que `ModalController` esté inyectado correctamente y que el componente `AddressSelectorComponent` esté importado

### La dirección no se muestra en el carrito

**Solución:** Verificar que el método `loadDefaultAddress()` se ejecute en `ngOnInit()` del cart.page.ts
