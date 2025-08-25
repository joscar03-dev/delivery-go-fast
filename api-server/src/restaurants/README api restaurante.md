# API de Restaurantes y Menús

## Descripción

Este módulo proporciona funcionalidad completa para gestionar restaurantes, sus menús y categorías, incluyendo consultas geoespaciales para encontrar restaurantes cercanos.

## Endpoints Públicos

### Obtener Restaurantes Cercanos

```
GET /restaurants
```

**Query Parameters:**

- `latitude` (opcional): Latitud de la ubicación del usuario
- `longitude` (opcional): Longitud de la ubicación del usuario
- `radius` (opcional): Radio de búsqueda en kilómetros (por defecto: 10km)

**Ejemplo:**

```
GET /restaurants?latitude=-16.4040102&longitude=-71.559611&radius=5
```

**Respuesta:**

```json
[
  {
    "id": "uuid",
    "name": "Pizza Palace",
    "address": "Av. Principal 123",
    "phone": "+51987654321",
    "location": "POINT(-71.559611 -16.4040102)",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z",
    "category": {
      "id": "uuid",
      "name": "Comida Italiana",
      "description": "Restaurantes especializados en comida italiana"
    },
    "owner": {
      "id": "uuid",
      "name": "Juan Pérez"
    }
  }
]
```

### Obtener Detalles de un Restaurante

```
GET /restaurants/:id
```

**Respuesta:**

```json
{
  "id": "uuid",
  "name": "Pizza Palace",
  "address": "Av. Principal 123",
  "phone": "+51987654321",
  "location": "POINT(-71.559611 -16.4040102)",
  "category": { ... },
  "owner": { ... },
  "menuItems": [
    {
      "id": "uuid",
      "name": "Pizza Margherita",
      "description": "Pizza clásica con tomate y mozzarella",
      "price": "25.00",
      "imageUrl": "https://...",
      "category": { ... }
    }
  ]
}
```

### Obtener Menú de un Restaurante

```
GET /restaurants/:id/menu
```

**Respuesta:**

```json
[
  {
    "id": "uuid",
    "name": "Pizza Margherita",
    "description": "Pizza clásica con tomate y mozzarella",
    "price": "25.00",
    "imageUrl": "https://...",
    "category": {
      "id": "uuid",
      "name": "Comida Italiana"
    }
  }
]
```

### Obtener Categorías

```
GET /restaurants/categories/all
```

## Endpoints Administrativos (Requieren rol SUPER_ADMIN)

### Crear Restaurante

```
POST /restaurants
```

**Body:**

```json
{
  "name": "Pizza Palace",
  "address": "Av. Principal 123",
  "phone": "+51987654321",
  "latitude": -16.4040102,
  "longitude": -71.559611,
  "categoryId": "uuid",
  "ownerId": "uuid"
}
```

### Actualizar Restaurante

```
PATCH /restaurants/:id
```

**Body (todos los campos son opcionales):**

```json
{
  "name": "Pizza Palace Updated",
  "address": "Nueva dirección",
  "phone": "+51999888777",
  "latitude": -16.4040102,
  "longitude": -71.559611,
  "categoryId": "uuid"
}
```

### Eliminar Restaurante

```
DELETE /restaurants/:id
```

### Gestión de Menú

#### Crear Item de Menú

```
POST /restaurants/:id/menu
```

**Body:**

```json
{
  "name": "Pizza Margherita",
  "description": "Pizza clásica con tomate y mozzarella",
  "price": 25.0,
  "imageUrl": "https://...",
  "categoryId": "uuid"
}
```

#### Obtener Item Específico del Menú

```
GET /restaurants/:restaurantId/menu/:itemId
```

#### Actualizar Item de Menú

```
PATCH /restaurants/:restaurantId/menu/:itemId
```

#### Eliminar Item de Menú

```
DELETE /restaurants/:restaurantId/menu/:itemId
```

### Gestión de Categorías

#### Crear Categoría

```
POST /restaurants/categories
```

**Body:**

```json
{
  "name": "Comida Mexicana",
  "description": "Restaurantes que sirven comida tradicional mexicana"
}
```

#### Poblar Categorías por Defecto

```
POST /restaurants/categories/seed
```

Este endpoint creará las categorías predefinidas si no existen.

## Autenticación

Los endpoints administrativos requieren:

1. Token JWT válido en el header `Authorization: Bearer <token>`
2. Rol de usuario `SUPER_ADMIN`

## Consultas Geoespaciales

El sistema utiliza PostGIS para consultas geoespaciales eficientes:

- Las ubicaciones se almacenan como puntos geográficos con SRID 4326 (WGS 84)
- Las consultas de cercanía utilizan `ST_DWithin` para encontrar restaurantes dentro del radio especificado
- Los resultados se ordenan por distancia usando `ST_Distance`

## Validaciones

- **Coordenadas**: Latitud entre -90 y 90, longitud entre -180 y 180
- **Teléfono**: Debe ser un número de teléfono válido
- **Precio**: Debe ser un número decimal positivo
- **UUIDs**: Todos los IDs deben ser UUIDs válidos

## Base de Datos

### Entidades Principales

1. **Restaurant**: Almacena información del restaurante incluyendo ubicación geográfica
2. **MenuItem**: Items del menú asociados a un restaurante
3. **Category**: Categorías para clasificar restaurantes y items del menú

### Relaciones

- Un restaurante pertenece a un usuario (owner)
- Un restaurante puede tener una categoría
- Un restaurante tiene muchos items de menú
- Un item de menú pertenece a un restaurante
- Un item de menú puede tener una categoría
