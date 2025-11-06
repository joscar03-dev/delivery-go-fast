# Wave Background - Implementación

## ✅ Componente Creado

- `src/app/components/wave-background/` - Componente standalone reutilizable

## ✅ Páginas Actualizadas

### Principales (Completadas)

- ✅ `tab1` (Home) - Ya tenía el fondo
- ✅ `restaurant-detail` - Detalle de restaurante
- ✅ `cart` - Carrito de compras
- ✅ `order-history` - Historial de pedidos

### Pendientes de Actualizar

- ⏳ `profile` - Perfil de usuario
- ⏳ `order-detail` - Detalle de pedido
- ⏳ `menu-item-detail` - Detalle de item del menú
- ⏳ `restaurant-orders` - Pedidos del restaurante
- ⏳ `delivery-driver/*` - Páginas del repartidor
- ⏳ `admin/*` - Páginas de administración
- ⏳ `auth/*` - Páginas de autenticación

## Uso del Componente

### 1. Importar en el componente TypeScript:

```typescript
import { WaveBackgroundComponent } from '../../components/wave-background/wave-background.component';

@Component({
  imports: [
    // ... otros imports
    WaveBackgroundComponent,
  ]
})
```

### 2. Agregar en el HTML (al inicio del ion-content):

```html
<ion-content>
  <app-wave-background></app-wave-background>

  <!-- Tu contenido aquí -->
</ion-content>
```

### 3. Agregar z-index en el SCSS (para que el contenido esté sobre la ola):

```scss
// Asegurar que el contenido esté sobre el fondo de ola
.mi-contenido,
.otros-elementos {
  position: relative;
  z-index: 1;
}
```

## Características del Fondo de Ola

- **Altura**: 380px
- **Gradiente**: De `--ion-color-primary` a `--ion-color-primary-shade`
- **Diagonal**: De izquierda inferior a derecha superior
- **No interactivo**: `pointer-events: none`
- **Z-index**: 0 (detrás del contenido)
