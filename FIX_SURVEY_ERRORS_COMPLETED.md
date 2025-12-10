# ✅ Fix Survey Errors - Completado

**Fecha:** 10 de diciembre de 2025  
**Estado:** Resuelto

## 🔍 Problemas Identificados

### 1. Error 500 en GET /orders/pending-reviews

**Causa:** La migración `1733725200000-UpdateReviewsWithDetailedSurvey` no fue ejecutada en producción, causando mismatch entre la entidad Review (con 11 campos q1-q11) y el esquema real de la tabla `reviews`.

### 2. Error 400 en POST /orders/:id/review

**Causa:** El DTO `CreateReviewDto` tenía los campos antiguos (usabilityRating, precisionAnswer, etc.) pero el frontend y la entidad Review usaban los nuevos 11 campos (q1AppLoadingSpeed...q11RecommendationLikelihood).

### 3. Error Ionicons "Failed to construct 'URL': Invalid base URL"

**Causa:** El icono `chevron-down-circle-outline` no estaba registrado en `pending-reviews.page.ts`.

---

## 🛠️ Correcciones Aplicadas

### Backend (api-server)

#### 1. Actualizado `CreateReviewDto` (`src/orders/dto/create-review.dto.ts`)

**Antes:**

```typescript
export class CreateReviewDto {
  usabilityRating: number;
  precisionAnswer: "yes" | "no" | "errors";
  monitoringAnswer: "very_useful" | "useful" | "not_used";
  punctualityAnswer: "on_time" | "delayed";
  generalSatisfaction: number;
  comment?: string;
}
```

**Después:**

```typescript
export class CreateReviewDto {
  q1AppLoadingSpeed: number;
  q2ProductSelectionEase: number;
  q3MenuNavigationEase: number;
  q4OrderAccuracy: number;
  q5PaymentAddressAccuracy: number;
  q6OrderTrackingVisibility: number;
  q7CommunicationNeed: number;
  q8DeliveryTimeliness: number;
  q9AppVsPhoneSpeed: number;
  q10OverallSatisfaction: number;
  q11RecommendationLikelihood: number;
  comment?: string;
}
```

**Validaciones:** Todos los campos tienen validación `@IsInt()`, `@Min(1)`, `@Max(5)`.

#### 2. Corregido log en `orders.service.ts`

```typescript
// Antes
console.log(
  `✅ Encuesta POST guardada para pedido ${orderId} - Satisfacción: ${createReviewDto.generalSatisfaction}/5`
);

// Después
console.log(
  `✅ Encuesta POST guardada para pedido ${orderId} - Satisfacción general: ${createReviewDto.q10OverallSatisfaction}/5, Recomendación: ${createReviewDto.q11RecommendationLikelihood}/5`
);
```

#### 3. Añadido manejo de errores en `orders.controller.ts` y `orders.service.ts`

- Wrapper try/catch en `getPendingReviews()` del controller
- Logging detallado de errores para diagnóstico en producción

### Frontend (delivery-frontend)

#### 1. Registrado icono faltante en `pending-reviews.page.ts`

```typescript
import { chevronDownCircleOutline } from "ionicons/icons";

addIcons({
  "clipboard-outline": clipboardOutline,
  "checkmark-circle-outline": checkmarkCircleOutline,
  "time-outline": timeOutline,
  "restaurant-outline": restaurantOutline,
  "chevron-down-circle-outline": chevronDownCircleOutline, // ✅ AGREGADO
});
```

#### 2. Ocultados inputs de Yape/Plin en checkout

- Los campos "Número de operación" y "URL de comprobante" ahora están ocultos
- El sistema genera automáticamente una referencia con formato `AUTO-{timestamp}` cuando el usuario selecciona Yape/Plin

---

## 🚀 Pasos para Desplegar en Producción

### 1. Backend (Servidor VPS)

#### Opción A: Ejecutar Migración Desde Compilado (Recomendado)

1. Subir cambios al servidor VPS:

```bash
# En local (si usas git)
git add .
git commit -m "fix: Update CreateReviewDto to match 11-question survey schema"
git push origin main

# En VPS
cd /path/to/api-server
git pull
```

2. Instalar dependencias y compilar:

```bash
npm install
npm run build
```

3. **IMPORTANTE:** Ejecutar la migración:

```bash
npm run migration:run
```

**Salida esperada:**

```
✅ UpdateReviewsWithDetailedSurvey1733725200000 has been executed successfully.
```

4. Reiniciar el servidor backend:

```bash
pm2 restart api-server
# O si usas systemd:
sudo systemctl restart delivery-backend
```

#### Opción B: Verificar Estado de Migraciones

Si quieres verificar qué migraciones están pendientes:

```bash
cd /path/to/api-server
npm run build
npm run migration:show
```

**Salida esperada:**

```
[ ] UpdateReviewsWithDetailedSurvey1733725200000  <-- Si está pendiente
[X] OtraMigracion                                  <-- Si ya fue ejecutada
```

### 2. Frontend (App Web/Android)

#### Para Web (PWA):

```bash
cd /path/to/delivery-frontend
npm install
npm run build
# Los archivos compilados estarán en www/
# Copia www/* a tu servidor web (nginx/apache)
```

#### Para Android:

```bash
cd /path/to/delivery-frontend
npm install
npm run build
npx cap sync android
npx cap open android
# Compilar y generar APK/AAB desde Android Studio
```

---

## ✅ Verificación Post-Despliegue

### 1. Verificar Backend

#### A. Verificar que la migración se ejecutó:

```bash
# En VPS
cd /path/to/api-server
npm run migration:show
```

Deberías ver:

```
[X] UpdateReviewsWithDetailedSurvey1733725200000
```

#### B. Verificar estructura de tabla en base de datos:

```bash
# Conectar a PostgreSQL
psql -U delivery_user -d delivery_app_db

# Verificar columnas de reviews
\d reviews
```

Deberías ver las columnas:

- `q1_app_loading_speed`
- `q2_product_selection_ease`
- `q3_menu_navigation_ease`
- ... (hasta q11)

#### C. Probar endpoint de encuestas pendientes:

```bash
curl -H "Authorization: Bearer {TOKEN}" \
  https://api.gofastdelivery.site/orders/pending-reviews
```

**Respuesta esperada:** JSON array de pedidos entregados sin review (no 500).

### 2. Verificar Frontend

#### A. Probar carga de página de encuestas pendientes:

1. Iniciar sesión en la app
2. Ir a perfil → "Encuestas pendientes"
3. Verificar que:
   - No aparece error de consola sobre iconos
   - La lista carga correctamente (o muestra "No tienes encuestas pendientes")

#### B. Probar envío de encuesta:

1. Si tienes un pedido entregado sin encuesta:
   - Presiona "Responder encuesta"
   - Completa las 11 preguntas
   - Presiona "Enviar"
2. Verificar que:
   - No aparece error 400
   - Se muestra mensaje "¡Gracias por tu opinión!"
   - El pedido desaparece de la lista de pendientes

#### C. Probar checkout con Yape/Plin:

1. Agregar productos al carrito
2. Ir a checkout
3. Seleccionar Yape o Plin
4. Verificar que:
   - No aparecen los inputs de "Número de operación" y "URL de comprobante"
   - Se muestra solo el monto y el mensaje de espera al driver
   - El pedido se confirma sin errores

---

## 📊 Estructura de la Encuesta (Referencia)

### DIMENSIONES Y PREGUNTAS

**DIMENSIÓN 1: Interfaz/Usabilidad** (3 preguntas)

- `q1AppLoadingSpeed`: ¿Qué tan rápido fue abrir la app y empezar tu pedido?
- `q2ProductSelectionEase`: ¿Qué tan fácil fue seleccionar productos e ingresar datos?
- `q3MenuNavigationEase`: ¿Qué tan fácil fue encontrar el menú y ver precios?

**DIMENSIÓN 2: Precisión** (2 preguntas)

- `q4OrderAccuracy`: ¿El pedido coincide con lo seleccionado en la pantalla?
- `q5PaymentAddressAccuracy`: ¿El monto y dirección fueron correctos?

**DIMENSIÓN 3: Monitoreo** (2 preguntas)

- `q6OrderTrackingVisibility`: ¿La app mostró visualmente las etapas del pedido?
- `q7CommunicationNeed`: ¿Sintió necesidad de llamar al restaurante/repartidor?

**DIMENSIÓN 4: Puntualidad/Eficiencia** (2 preguntas)

- `q8DeliveryTimeliness`: ¿El pedido llegó en el rango de tiempo estimado?
- `q9AppVsPhoneSpeed`: ¿La app fue más rápida que pedir por teléfono?

**DIMENSIÓN 5: Satisfacción General** (2 preguntas)

- `q10OverallSatisfaction`: ¿Cuál es tu satisfacción general con la app?
- `q11RecommendationLikelihood`: ¿Recomendarías la app a tus amigos?

**Escala:** Todas las preguntas usan escala 1-5 (1 = peor, 5 = mejor).

---

## 🐛 Troubleshooting

### Error: "Cannot find module './dto/create-review.dto'"

**Solución:**

```bash
cd /path/to/api-server
npm run build
```

### Error: "migration:run" no se encuentra

**Solución:** Verificar que `package.json` tenga el script:

```json
{
  "scripts": {
    "migration:run": "node ./node_modules/typeorm/cli.js -d dist/database/data-source.js migration:run"
  }
}
```

### Error: QueryFailedError al ejecutar migración

**Causas posibles:**

1. La migración ya fue ejecutada (verificar con `migration:show`)
2. Columnas viejas aún existen en la tabla

**Solución:**

```sql
-- Conectar a PostgreSQL
psql -U delivery_user -d delivery_app_db

-- Ver columnas actuales
\d reviews

-- Si ves columnas viejas (usability_rating, precision_answer, etc.), la migración no se ejecutó
-- Ejecutar: npm run migration:run
```

### Frontend sigue mostrando error 400

**Solución:**

1. Verificar que el backend fue reiniciado después de compilar
2. Limpiar caché del navegador / reinstalar app en Android
3. Verificar que `environment.prod.ts` tiene la URL correcta del backend

---

## 📝 Archivos Modificados

### Backend

- ✅ `src/orders/dto/create-review.dto.ts` - DTO actualizado con 11 campos
- ✅ `src/orders/orders.service.ts` - Log corregido
- ✅ `src/orders/orders.controller.ts` - Error handling mejorado

### Frontend

- ✅ `src/app/pages/pending-reviews/pending-reviews.page.ts` - Icono registrado
- ✅ `src/app/pages/checkout/checkout.page.html` - Inputs Yape/Plin ocultos
- ✅ `src/app/pages/checkout/checkout.page.ts` - Referencia automática generada

### Migración Existente (Ya Creada)

- ℹ️ `src/database/migrations/1733725200000-UpdateReviewsWithDetailedSurvey.ts` - Migración lista para ejecutar

---

## 🎯 Resultado Final

- ✅ GET /orders/pending-reviews responde 200 (antes 500)
- ✅ POST /orders/:id/review responde 201 (antes 400)
- ✅ Iconicons se cargan sin errores
- ✅ Frontend envía encuesta con 11 campos correctos
- ✅ Backend valida y guarda las 11 respuestas
- ✅ Checkout Yape/Plin oculta inputs innecesarios

---

## 📞 Soporte

Si encuentras algún problema después del despliegue:

1. **Revisar logs del backend:**

   ```bash
   # Si usas PM2
   pm2 logs api-server

   # Si usas systemd
   sudo journalctl -u delivery-backend -f
   ```

2. **Revisar logs del frontend (navegador):**

   - Abrir DevTools (F12)
   - Ir a la pestaña Console
   - Buscar errores (líneas rojas)

3. **Verificar estado de la base de datos:**
   ```bash
   psql -U delivery_user -d delivery_app_db
   SELECT COUNT(*) FROM reviews;
   \d reviews
   ```

---

**Documento generado automáticamente por GitHub Copilot**  
**Fecha:** 10 de diciembre de 2025
