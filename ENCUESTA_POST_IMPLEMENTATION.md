# 📋 Sistema de Encuesta POST de Satisfacción del Cliente

## 📊 Descripción General

Sistema completo de encuestas académicas para medir la satisfacción del cliente después de la entrega de pedidos. El sistema envía automáticamente una notificación push al cliente cuando su pedido es entregado, invitándolo a completar una breve encuesta que mide dimensiones específicas de la experiencia.

## 🎯 Objetivo Académico

Medir el impacto de la aplicación móvil en la satisfacción del cliente a través de diferentes dimensiones:

1. **Usabilidad/Interfaz** - ¿Qué tan fácil fue usar la app?
2. **Precisión** - ¿El pedido llegó completo y correcto?
3. **Monitoreo** - ¿Fue útil el seguimiento en tiempo real?
4. **Eficiencia/Puntualidad** - ¿El pedido llegó a tiempo?
5. **Satisfacción General** (Variable Dependiente) - Satisfacción general con la experiencia

---

## 🔧 Implementación Técnica

### 📁 Backend (NestJS)

#### 1. **Entidad Review Actualizada**

📂 `api-server/src/orders/entities/review.entity.ts`

```typescript
@Entity("reviews")
export class Review {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  // DIMENSIÓN 1: USABILIDAD/INTERFAZ (1-5)
  @Column({ type: "smallint", name: "usability_rating" })
  usabilityRating: number;

  // DIMENSIÓN 2: PRECISIÓN (yes/no/errors)
  @Column({ type: "enum", enum: ["yes", "no", "errors"] })
  precisionAnswer: "yes" | "no" | "errors";

  // DIMENSIÓN 3: MONITOREO (very_useful/useful/not_used)
  @Column({ type: "enum", enum: ["very_useful", "useful", "not_used"] })
  monitoringAnswer: "very_useful" | "useful" | "not_used";

  // DIMENSIÓN 4: PUNTUALIDAD (on_time/delayed)
  @Column({ type: "enum", enum: ["on_time", "delayed"] })
  punctualityAnswer: "on_time" | "delayed";

  // VARIABLE DEPENDIENTE: SATISFACCIÓN GENERAL (1-5)
  @Column({ type: "smallint", name: "general_satisfaction" })
  generalSatisfaction: number;

  // COMENTARIOS OPCIONALES
  @Column({ type: "text", nullable: true })
  comment: string;

  @OneToOne(() => Order)
  @JoinColumn({ name: "order_id" })
  order: Order;

  @CreateDateColumn()
  createdAt: Date;
}
```

**Cambios importantes:**

- ✅ Eliminados campos antiguos (`rating`, `driverRating`, `restaurantRating`)
- ✅ Agregadas 5 dimensiones específicas para investigación académica
- ✅ Usa tipos ENUM para respuestas predefinidas
- ✅ Relación OneToOne con Order

#### 2. **DTO de Validación**

📂 `api-server/src/orders/dto/create-review.dto.ts`

```typescript
export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  usabilityRating: number;

  @IsEnum(["yes", "no", "errors"])
  precisionAnswer: "yes" | "no" | "errors";

  @IsEnum(["very_useful", "useful", "not_used"])
  monitoringAnswer: "very_useful" | "useful" | "not_used";

  @IsEnum(["on_time", "delayed"])
  punctualityAnswer: "on_time" | "delayed";

  @IsInt()
  @Min(1)
  @Max(5)
  generalSatisfaction: number;

  @IsOptional()
  @IsString()
  comment?: string;
}
```

#### 3. **Endpoint para Enviar Encuesta**

📂 `api-server/src/orders/orders.controller.ts`

```typescript
/**
 * POST /api/orders/:id/review
 * Endpoint para que el cliente envíe la encuesta POST de satisfacción
 */
@Post(':id/review')
@Roles(Role.CLIENT, Role.SUPER_ADMIN)
createReview(
  @Param('id', ParseUUIDPipe) orderId: string,
  @Body() createReviewDto: CreateReviewDto,
  @Request() req,
) {
  const currentUser = req.user;
  return this.ordersService.createReview(
    orderId,
    createReviewDto,
    currentUser.id,
  );
}
```

#### 4. **Lógica de Negocio**

📂 `api-server/src/orders/orders.service.ts`

**Método `createReview()`:**

```typescript
async createReview(
  orderId: string,
  createReviewDto: CreateReviewDto,
  clientId: string,
): Promise<Review> {
  // 1. Verificar que el pedido existe
  // 2. Verificar que el pedido pertenece al cliente
  // 3. Verificar que el pedido está entregado (status = DELIVERED)
  // 4. Verificar que no exista ya una review
  // 5. Crear y guardar la review

  const review = this.reviewRepository.create({
    ...createReviewDto,
    order,
  });

  return await this.reviewRepository.save(review);
}
```

**Notificación Push Automática:**
Modificado `emitOrderStatusUpdate()` para enviar notificación cuando status = DELIVERED:

```typescript
// En emitOrderStatusUpdate()
if (newStatus === OrderStatus.DELIVERED && order && order.client) {
  await this.notificationsService.sendToUser(order.client.id, {
    title: "🎉 ¡Pedido entregado!",
    body: "¿Cómo fue tu experiencia? Ayúdanos con una breve encuesta",
    data: {
      screen: "survey",
      orderId: order.id,
      orderNumber: order.id.substring(0, 8),
    },
    type: "ORDER_DELIVERED" as any,
  });
}
```

---

### 📱 Frontend (Ionic/Angular)

#### 1. **Página de Encuesta**

📂 `delivery-frontend/src/app/pages/survey/survey.page.ts`
📂 `delivery-frontend/src/app/pages/survey/survey.page.html`

**Componentes principales:**

1. **Pregunta 1 - Usabilidad (Ion-Range 1-5)**

   ```html
   <ion-range
     [(ngModel)]="usabilityRating"
     [min]="1"
     [max]="5"
     [pin]="true"
     [pinFormatter]="getUsabilityLabel.bind(this)"
   ></ion-range>
   ```

2. **Pregunta 2 - Precisión (Ion-Radio-Group)**

   ```html
   <ion-radio-group [(ngModel)]="precisionAnswer">
     <ion-item>
       <ion-radio value="yes"></ion-radio>
       <ion-label>Sí, todo correcto</ion-label>
     </ion-item>
     <ion-item>
       <ion-radio value="no"></ion-radio>
       <ion-label>No, faltaron productos</ion-label>
     </ion-item>
     <ion-item>
       <ion-radio value="errors"></ion-radio>
       <ion-label>Hubo errores en el pedido</ion-label>
     </ion-item>
   </ion-radio-group>
   ```

3. **Pregunta 3 - Monitoreo (Ion-Radio-Group)**

   - very_useful
   - useful
   - not_used

4. **Pregunta 4 - Puntualidad (Ion-Radio-Group)**

   - on_time
   - delayed

5. **Pregunta 5 - Satisfacción General (Ion-Range 1-5)**

   ```html
   <ion-range
     [(ngModel)]="generalSatisfaction"
     [min]="1"
     [max]="5"
     [pin]="true"
     [pinFormatter]="getSatisfactionLabel.bind(this)"
   ></ion-range>
   ```

6. **Comentarios Opcionales (Ion-Textarea)**
   ```html
   <ion-textarea
     [(ngModel)]="comment"
     placeholder="¿Algo más que quieras compartir?"
     [rows]="4"
     [maxlength]="500"
   ></ion-textarea>
   ```

**Funcionalidades:**

- ✅ Validación de campos requeridos
- ✅ Confirmación antes de enviar
- ✅ Toast de éxito/error
- ✅ Redirección a historial de pedidos después de enviar

#### 2. **Servicio de Órdenes Actualizado**

📂 `delivery-frontend/src/app/services/order.service.ts`

```typescript
/**
 * Envía la encuesta POST de satisfacción
 */
submitSurvey(orderId: string, surveyData: {
  usabilityRating: number;
  precisionAnswer: 'yes' | 'no' | 'errors';
  monitoringAnswer: 'very_useful' | 'useful' | 'not_used';
  punctualityAnswer: 'on_time' | 'delayed';
  generalSatisfaction: number;
  comment?: string;
}): Observable<any> {
  return this.http.post(
    `${this.apiUrl}/${orderId}/review`,
    surveyData,
    { headers: this.getHeaders() }
  );
}
```

#### 3. **Ruta Agregada**

📂 `delivery-frontend/src/app/app.routes.ts`

```typescript
{
  path: 'survey/:id',
  canMatch: [authGuard],
  loadComponent: () =>
    import('./pages/survey/survey.page').then((m) => m.SurveyPage),
}
```

#### 4. **Navegación desde Notificación Push**

📂 `delivery-frontend/src/app/services/push-notification.service.ts`

```typescript
// En navigateToScreen()
case 'survey':
  if (orderId) {
    console.log('📋 Navegando a encuesta POST para pedido:', orderId);
    this.router.navigate(['/survey', orderId]);
  }
  break;
```

---

## 🚀 Flujo Completo

### 1. **Pedido Entregado**

```
Repartidor marca pedido como "delivered"
→ OrdersService.update()
→ emitOrderStatusUpdate(DELIVERED)
```

### 2. **Notificación Push Enviada**

```
NotificationsService.sendToUser()
→ Firebase Cloud Messaging
→ Dispositivo del cliente recibe notificación
```

### 3. **Cliente Abre Notificación**

```
Notificación contiene data: { screen: 'survey', orderId: '123' }
→ push-notification.service.ts detecta tap
→ navigateToScreen('survey', '123')
→ Router navega a /survey/123
```

### 4. **Cliente Completa Encuesta**

```
SurveyPage carga con orderId
→ Cliente llena formulario
→ submitSurvey()
→ Confirmación con Alert
→ POST /api/orders/123/review
```

### 5. **Backend Valida y Guarda**

```
OrdersController.createReview()
→ OrdersService.createReview()
→ Validaciones:
   - Pedido existe
   - Pertenece al cliente
   - Status = DELIVERED
   - No existe review previa
→ Crea Review y guarda en BD
→ Respuesta 201 Created
```

### 6. **Confirmación al Cliente**

```
Frontend recibe respuesta exitosa
→ Toast: "¡Gracias por tu feedback! 🎉"
→ Navega a /tabs/order-history
```

---

## 🗄️ Estructura de Base de Datos

### Tabla `reviews` (Nueva Estructura)

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) UNIQUE,

  -- Dimensiones de la encuesta
  usability_rating SMALLINT NOT NULL CHECK (usability_rating BETWEEN 1 AND 5),
  precision_answer VARCHAR(10) NOT NULL CHECK (precision_answer IN ('yes', 'no', 'errors')),
  monitoring_answer VARCHAR(15) NOT NULL CHECK (monitoring_answer IN ('very_useful', 'useful', 'not_used')),
  punctuality_answer VARCHAR(10) NOT NULL CHECK (punctuality_answer IN ('on_time', 'delayed')),
  general_satisfaction SMALLINT NOT NULL CHECK (general_satisfaction BETWEEN 1 AND 5),

  -- Comentarios opcionales
  comment TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Índices

```sql
CREATE INDEX idx_reviews_order_id ON reviews(order_id);
CREATE INDEX idx_reviews_created_at ON reviews(created_at);
CREATE INDEX idx_reviews_general_satisfaction ON reviews(general_satisfaction);
```

---

## 📊 Análisis de Datos (Para Investigación)

### Consultas SQL Útiles

**1. Promedio de satisfacción general:**

```sql
SELECT AVG(general_satisfaction) as avg_satisfaction
FROM reviews;
```

**2. Distribución de respuestas de usabilidad:**

```sql
SELECT usability_rating, COUNT(*) as count
FROM reviews
GROUP BY usability_rating
ORDER BY usability_rating;
```

**3. Tasa de precisión de pedidos:**

```sql
SELECT
  precision_answer,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM reviews
GROUP BY precision_answer;
```

**4. Correlación entre puntualidad y satisfacción:**

```sql
SELECT
  punctuality_answer,
  AVG(general_satisfaction) as avg_satisfaction
FROM reviews
GROUP BY punctuality_answer;
```

**5. Utilidad del monitoreo en tiempo real:**

```sql
SELECT
  monitoring_answer,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM reviews
GROUP BY monitoring_answer;
```

---

## ✅ Validaciones Implementadas

### Backend

- ✅ Solo clientes pueden enviar encuestas
- ✅ Solo se puede encuestar pedidos entregados (DELIVERED)
- ✅ Solo el cliente dueño del pedido puede encuestar
- ✅ No se puede enviar más de una encuesta por pedido
- ✅ Validación de rangos (1-5 para ratings)
- ✅ Validación de valores ENUM

### Frontend

- ✅ Guard de autenticación (solo usuarios logueados)
- ✅ Validación de campos requeridos
- ✅ Confirmación antes de enviar
- ✅ Feedback visual (toasts, spinners)
- ✅ Navegación automática después de enviar

---

## 🔐 Seguridad

1. **Autenticación**: JWT obligatorio
2. **Autorización**: Solo el cliente puede enviar su encuesta
3. **Validación**: DTOs con class-validator
4. **Protección contra duplicados**: Constraint UNIQUE en order_id
5. **Rate limiting**: Configurado a nivel de NestJS

---

## 📱 UX/UI Features

1. **Sliders con etiquetas dinámicas** para ratings
2. **Radio buttons con iconos** para respuestas visuales
3. **Colores semánticos** (success/danger/warning)
4. **Confirmación antes de enviar** para evitar errores
5. **Toast messages** para feedback inmediato
6. **Diseño responsive** con Ion-Card
7. **Notas de ayuda** en cada pregunta

---

## 🚀 Testing Manual

### Paso 1: Crear y entregar un pedido

```bash
1. Cliente crea pedido desde la app
2. Restaurante acepta el pedido
3. Repartidor recoge el pedido
4. Repartidor marca como "Entregado"
```

### Paso 2: Verificar notificación

```bash
Cliente recibe notificación push:
Título: "🎉 ¡Pedido entregado!"
Mensaje: "¿Cómo fue tu experiencia? Ayúdanos con una breve encuesta"
```

### Paso 3: Completar encuesta

```bash
1. Cliente toca la notificación
2. App navega a /survey/:orderId
3. Cliente llena las 5 preguntas
4. Cliente toca "Enviar encuesta"
5. Confirmación: "¿Estás seguro de enviar tus respuestas?"
6. Toast: "¡Gracias por tu feedback! 🎉"
7. Redirige a historial de pedidos
```

### Paso 4: Verificar en BD

```sql
SELECT * FROM reviews WHERE order_id = '<order_id>';
```

---

## 📈 Métricas de Éxito

1. **Tasa de respuesta**: % de clientes que completan la encuesta
2. **Tiempo promedio de respuesta**: Desde notificación hasta envío
3. **Distribución de satisfacción**: Histograma de ratings
4. **Correlaciones**: Entre dimensiones y satisfacción general
5. **Comentarios cualitativos**: Análisis de texto libre

---

## 🔄 Próximas Mejoras (Opcional)

1. **Dashboard de análisis** para ver estadísticas en tiempo real
2. **Recordatorios** si el cliente no completa la encuesta en 24h
3. **Incentivos** (descuentos por completar encuesta)
4. **Encuestas PRE** para comparación antes/después
5. **Exportación de datos** a CSV/Excel para análisis estadístico
6. **Gráficos visuales** con Chart.js o D3.js

---

## 📝 Archivos Modificados/Creados

### Backend

- ✅ `review.entity.ts` - Rediseñada completamente
- ✅ `create-review.dto.ts` - Nuevo DTO con validaciones
- ✅ `orders.controller.ts` - Agregado endpoint POST /orders/:id/review
- ✅ `orders.service.ts` - Método createReview() + notificación push
- ✅ `order.entity.ts` - Relación OneToOne con Review

### Frontend

- ✅ `survey.page.ts` - Nueva página de encuesta
- ✅ `survey.page.html` - Template con formulario estructurado
- ✅ `survey.page.scss` - Estilos personalizados
- ✅ `order.service.ts` - Método submitSurvey()
- ✅ `app.routes.ts` - Ruta /survey/:id
- ✅ `push-notification.service.ts` - Case 'survey' en navegación

---

## 🎓 Uso Académico

Este sistema está diseñado para investigación académica sobre el impacto de aplicaciones móviles en la satisfacción del cliente. Las dimensiones medidas permiten:

1. **Análisis cuantitativo**: Correlaciones, regresiones, pruebas de hipótesis
2. **Análisis cualitativo**: Análisis de comentarios con NLP
3. **Comparación temporal**: Mediciones PRE/POST
4. **Segmentación**: Por tipo de restaurante, zona geográfica, etc.

---

## 🛠️ Migración de BD

**IMPORTANTE**: Antes de usar en producción, ejecutar migración para actualizar la estructura de `reviews`:

```bash
cd api-server
npm run migration:generate -- src/migrations/UpdateReviewsForSurvey
npm run migration:run
```

Esto modificará la tabla `reviews` y eliminará las columnas antiguas.

---

## 📞 Soporte

Para dudas o problemas con la implementación, verificar:

1. ✅ Backend compilado sin errores
2. ✅ Frontend compilado sin errores
3. ✅ Firebase configurado correctamente
4. ✅ Migración de BD ejecutada
5. ✅ Usuario tiene pedidos entregados para probar

---

## 🎉 ¡Implementación Completa!

El sistema de encuestas POST está completamente funcional y listo para recolectar datos de satisfacción del cliente. 📊
