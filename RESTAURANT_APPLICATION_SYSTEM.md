# 🏪 Sistema de Solicitudes de Restaurantes

## 📋 Resumen Completo

Sistema completo para que restaurantes/negocios soliciten unirse a la plataforma. Incluye formulario público, panel de administración y cambio automático de roles.

---

## ✅ Implementación Completada

### **Backend (100%)**

#### **Archivos Creados:**

1. **Entity**: `api-server/src/restaurant-applications/entities/restaurant-application.entity.ts`

   - Tabla: `restaurant_applications`
   - Campos: businessName, businessPhone, businessEmail, address, categoryId, city, ownerName, ownerDni, additionalComments, status, adminNotes, reviewedBy, reviewedAt, restaurantId

2. **DTOs**:

   - `dto/create-restaurant-application.dto.ts` - Validaciones completas
   - `dto/update-application-status.dto.ts` - Para cambios de estado

3. **Service**: `restaurant-applications.service.ts`

   - `create()` - Crear solicitud con validación de duplicados
   - `findAll()` - Listar todas (admin)
   - `findOne()` - Ver detalle
   - `findByUserId()` - Ver mi solicitud
   - `updateStatus()` - Cambiar estado
   - `approveAndCreateRestaurant()` - Aprobar y cambiar rol
   - `reject()` - Rechazar
   - `remove()` - Eliminar
   - `getStats()` - Estadísticas

4. **Controllers**:

   - `RestaurantApplicationsController` - Endpoints públicos (requieren login)
   - `AdminRestaurantApplicationsController` - Endpoints admin (SUPER_ADMIN)

5. **Module**: `restaurant-applications.module.ts`

   - Registrado en `app.module.ts`

6. **Migration**: `20251110205716-CreateRestaurantApplicationsTable.ts`
   - Tabla creada ✅
   - Foreign keys: user_id, category_id, reviewed_by
   - Índices: user_id, status, category_id

---

### **Frontend - Usuario (100%)**

#### **Archivos Creados:**

1. **Modelo**: `models/restaurant-application.model.ts`

   - Interface `RestaurantApplication`
   - Interface `CreateRestaurantApplicationDto`
   - Enums: `City`, `ApplicationStatus`

2. **Service**: `services/restaurant-application.service.ts`

   - Métodos USER: create(), getMyApplication(), getById()
   - Métodos ADMIN: getAllAdmin(), getStats(), updateStatus(), approveAndCreateRestaurant(), reject(), delete()

3. **Página**: `pages/restaurant-application/`

   - **TypeScript**: Formulario completo con validaciones
   - **HTML**: Formulario de 1 paso + vista de solicitud existente
   - **SCSS**: Estilos responsive

4. **Integración**: `pages/profile/profile.page.ts`
   - Método `navigateToRestaurantApplication()` agregado
   - Redirige a login si no está autenticado
   - Botones conectados en HTML (2 ubicaciones: guest y logged in)

---

### **Frontend - Admin (100%)**

#### **Archivos Creados:**

1. **Lista**: `pages/admin/admin-restaurant-applications/`

   - **TypeScript**: Lista con filtros por estado
   - **HTML**: Cards con info del negocio, filtros, refresh
   - **SCSS**: Estilos similares a driver-applications

2. **Detalle**: `pages/admin/admin-restaurant-application-detail/`
   - **TypeScript**: Vista completa con todas las acciones
   - **HTML**: Cards con toda la información + botones de acción
   - **SCSS**: Diseño limpio y profesional
   - **Acciones disponibles**:
     - ✅ Aprobar y Crear Restaurante
     - ❌ Rechazar (con razón obligatoria)
     - 👁️ Marcar como "En Revisión"
     - ⏰ Volver a "Pendiente"
     - 🗑️ Eliminar solicitud

---

## 🔗 Endpoints Disponibles

### **Públicos (Requieren Login)**

```
POST   /restaurant-applications
       Body: CreateRestaurantApplicationDto
       Response: RestaurantApplication

GET    /restaurant-applications/my-application
       Response: RestaurantApplication | null

GET    /restaurant-applications/:id
       Response: RestaurantApplication
```

### **Admin (SUPER_ADMIN)**

```
GET    /admin/restaurant-applications
       Response: RestaurantApplication[]

GET    /admin/restaurant-applications/stats
       Response: { total, pending, underReview, approved, rejected }

GET    /admin/restaurant-applications/:id
       Response: RestaurantApplication

PATCH  /admin/restaurant-applications/:id/status
       Body: { status, adminNotes? }
       Response: RestaurantApplication

POST   /admin/restaurant-applications/:id/approve
       Body: { adminNotes? }
       Response: RestaurantApplication
       Effect: Cambia rol del usuario a RESTAURANT_OWNER

POST   /admin/restaurant-applications/:id/reject
       Body: { reason }
       Response: RestaurantApplication

DELETE /admin/restaurant-applications/:id
       Response: { message }
```

---

## 🎯 Flujo Completo del Usuario

### **1. Usuario Cliente (sin restaurante)**

```
1. Login como cliente normal
2. Va a Perfil → "¿Tienes un negocio?"
3. Click → Redirige a /restaurant-application
4. Llena formulario:
   - Nombre del negocio
   - Teléfono
   - Email (opcional)
   - Categoría (select desde BD)
   - Ciudad (enum)
   - Dirección
   - Nombre del representante
   - DNI
   - Comentarios (opcional)
5. Click "Enviar Solicitud"
6. Estado: PENDING (Pendiente)
7. Ve mensaje: "Tu solicitud está siendo revisada"
```

### **2. Usuario con Solicitud Pendiente**

```
1. Vuelve a /restaurant-application
2. Ve su solicitud existente con estado
3. No puede enviar otra (validación backend)
4. Ve mensaje según estado:
   - PENDING: "está siendo revisada"
   - UNDER_REVIEW: "en proceso de revisión"
   - APPROVED: "ha sido aprobada"
   - REJECTED: "fue rechazada"
```

### **3. Administrador**

```
1. Login como SUPER_ADMIN
2. Va a /admin/restaurant-applications
3. Ve lista de todas las solicitudes
4. Filtra por estado (Todas/Pendientes/En Revisión/Aprobadas/Rechazadas)
5. Click en una solicitud
6. Ve todos los detalles:
   - Información del negocio
   - Datos del representante
   - Usuario solicitante
   - Comentarios
   - Fechas
7. Opciones:
   a) APROBAR:
      - Escribe notas (opcional)
      - Click "Aprobar y Crear Restaurante"
      - Sistema cambia rol: CUSTOMER → RESTAURANT_OWNER
      - Usuario puede crear su restaurante
   b) RECHAZAR:
      - Escribe razón (obligatorio)
      - Click "Rechazar"
      - Usuario ve la razón
      - Usuario puede re-aplicar
   c) MARCAR EN REVISIÓN:
      - Estado cambia a UNDER_REVIEW
   d) ELIMINAR:
      - Elimina la solicitud permanentemente
```

### **4. Usuario Aprobado**

```
1. Recibe notificación (email/SMS - pendiente)
2. Va a /restaurant-application
3. Ve: "¡Felicidades! Tu solicitud ha sido aprobada"
4. Botón: "Ir a Mi Restaurante"
5. Redirige a /tabs/restaurant-admin
6. Ya tiene rol RESTAURANT_OWNER
7. Puede crear y gestionar su restaurante
```

---

## 🗄️ Estructura de Base de Datos

### **Tabla: `restaurant_applications`**

```sql
CREATE TABLE restaurant_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Datos del negocio
  business_name VARCHAR(255) NOT NULL,
  business_phone VARCHAR(20) NOT NULL,
  business_email VARCHAR(100),
  address TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES restaurant_categories(id),
  city ENUM('Bagua', 'Bagua Grande', 'Chachapoyas', 'Jaen') NOT NULL,

  -- Datos del representante
  owner_name VARCHAR(255) NOT NULL,
  owner_dni VARCHAR(20) NOT NULL,

  -- Comentarios
  additional_comments TEXT,

  -- Estado y revisión
  status ENUM('pending', 'under_review', 'approved', 'rejected') DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,

  -- ID del restaurante creado (al aprobar)
  restaurant_id UUID,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_restaurant_applications_user_id ON restaurant_applications(user_id);
CREATE INDEX idx_restaurant_applications_status ON restaurant_applications(status);
CREATE INDEX idx_restaurant_applications_category_id ON restaurant_applications(category_id);
```

---

## 📱 Rutas del Frontend

### **Usuario:**

- `/restaurant-application` - Formulario de solicitud

### **Admin:**

- `/admin/restaurant-applications` - Lista de solicitudes
- `/admin/restaurant-applications/:id` - Detalle de solicitud

---

## 🎨 Estados de Solicitud

| Estado         | Color              | Descripción                            |
| -------------- | ------------------ | -------------------------------------- |
| `pending`      | Primary (Azul)     | Pendiente de revisión inicial          |
| `under_review` | Warning (Amarillo) | En proceso de revisión                 |
| `approved`     | Success (Verde)    | Aprobada - Usuario es RESTAURANT_OWNER |
| `rejected`     | Danger (Rojo)      | Rechazada - Usuario puede re-aplicar   |

---

## 🔒 Validaciones Implementadas

### **Backend:**

- ✅ Usuario ya tiene solicitud pendiente/aprobada
- ✅ Nombre del negocio requerido (max 255 chars)
- ✅ Teléfono requerido (min 7, max 20 chars)
- ✅ Email válido (opcional)
- ✅ Categoría existe en BD
- ✅ Ciudad válida (enum)
- ✅ Nombre representante requerido
- ✅ DNI requerido (min 8 chars)

### **Frontend:**

- ✅ Todos los campos obligatorios validados
- ✅ Mensajes de error específicos
- ✅ Previene envío duplicado
- ✅ Muestra solicitud existente
- ✅ Loading states
- ✅ Confirmaciones para acciones destructivas

---

## 🧪 Testing Checklist

### **Usuario:**

- [ ] Usuario sin login → Click "¿Tienes un negocio?" → Redirige a login
- [ ] Usuario logueado → Click botón → Abre formulario
- [ ] Llenar formulario completo → Enviar → Éxito
- [ ] Intentar enviar otra solicitud → Error (ya existe)
- [ ] Ver estado de solicitud en la misma página
- [ ] Validaciones de campos vacíos
- [ ] Validaciones de formato (teléfono, email, DNI)

### **Admin:**

- [ ] Ver lista de solicitudes
- [ ] Filtrar por estado (todas/pendientes/revisión/aprobadas/rechazadas)
- [ ] Ver detalle de solicitud
- [ ] Aprobar solicitud → Verificar cambio de rol en BD
- [ ] Rechazar solicitud → Verificar razón guardada
- [ ] Marcar como "En Revisión"
- [ ] Volver a "Pendiente"
- [ ] Eliminar solicitud

### **Integración:**

- [ ] Usuario aprobado → Ver botón "Ir a Mi Restaurante"
- [ ] Usuario aprobado → Puede crear restaurante
- [ ] Verificar rol en tabla `users` cambió a `restaurant_owner`
- [ ] Verificar notas del admin se guardan
- [ ] Verificar fechas de revisión

---

## 📝 Notas Importantes

1. **Login Requerido**: A diferencia de drivers que también requieren login, los restaurantes siguen el mismo patrón para consistencia.

2. **Rol Automático**: Al aprobar, el sistema automáticamente cambia el rol del usuario de `customer` a `restaurant_owner`.

3. **No Duplicados**: Un usuario solo puede tener una solicitud activa (pending/under_review) o aprobada.

4. **Razón Obligatoria**: Al rechazar, el admin DEBE escribir una razón (validación frontend y backend).

5. **Historial**: Todas las solicitudes se guardan (incluso rechazadas) para auditoría.

---

## 🚀 Próximos Pasos

1. **Probar el flujo completo**:

   - Crear usuario de prueba
   - Aplicar como restaurante
   - Aprobar desde admin
   - Verificar cambio de rol
   - Crear restaurante

2. **Mejoras Opcionales**:

   - [ ] Notificaciones por email/SMS
   - [ ] Upload de documentos (RUC, DNI, foto del local)
   - [ ] Dashboard con estadísticas
   - [ ] Historial de cambios de estado
   - [ ] Comentarios/chat entre admin y solicitante
   - [ ] Verificación de datos por APIs externas (SUNAT, RENIEC)

3. **Agregar Link en Admin Dashboard**:
   - Agregar botón en página principal de admin
   - Similar a "Solicitudes de Conductores"

---

## 📂 Estructura de Archivos

```
api-server/src/restaurant-applications/
├── entities/
│   └── restaurant-application.entity.ts
├── dto/
│   ├── create-restaurant-application.dto.ts
│   └── update-application-status.dto.ts
├── restaurant-applications.controller.ts
├── restaurant-applications.service.ts
└── restaurant-applications.module.ts

delivery-frontend/src/app/
├── models/
│   └── restaurant-application.model.ts
├── services/
│   └── restaurant-application.service.ts
├── pages/
│   ├── restaurant-application/
│   │   ├── restaurant-application.page.ts
│   │   ├── restaurant-application.page.html
│   │   └── restaurant-application.page.scss
│   └── admin/
│       ├── admin-restaurant-applications/
│       │   ├── admin-restaurant-applications.page.ts
│       │   ├── admin-restaurant-applications.page.html
│       │   └── admin-restaurant-applications.page.scss
│       └── admin-restaurant-application-detail/
│           ├── admin-restaurant-application-detail.page.ts
│           ├── admin-restaurant-application-detail.page.html
│           └── admin-restaurant-application-detail.page.scss
```

---

## ✅ Sistema Completo y Funcional

Todo el código está implementado y listo para usar. Solo falta probar el flujo completo con datos reales.

**Fecha de Implementación**: 10 de noviembre de 2025
**Estado**: ✅ COMPLETADO
