# 📊 Dashboard de Análisis de Encuestas POST

## 🎯 Descripción General

Sistema completo de análisis y exportación de encuestas de satisfacción del cliente, integrado en el panel administrativo (Tab2). Permite visualizar estadísticas detalladas, gráficos por dimensión y exportar datos a CSV para análisis académico.

---

## 🏗️ Arquitectura del Sistema

### 📡 Backend (NestJS)

#### **Endpoints Creados**

**1. GET `/api/orders/admin/reviews/analytics`**

- **Rol requerido:** `super_admin`
- **Descripción:** Obtiene estadísticas completas de todas las encuestas
- **Respuesta:**

```typescript
{
  totalResponses: number;
  averages: {
    q1AppLoadingSpeed: number;
    q2ProductSelectionEase: number;
    // ... 11 preguntas
  };
  distribution: {
    q1: { 1: number, 2: number, 3: number, 4: number, 5: number };
    // ... para cada pregunta
  };
  dimensions: {
    interfazUsabilidad: {
      name: string;
      average: number;
      questions: Array<{ id, text, average }>;
    };
    // ... 5 dimensiones
  };
  recentReviews: Array<{
    id, orderId, createdAt, client, restaurant, averageScore, comment
  }>;
}
```

**2. GET `/api/orders/admin/reviews/all`**

- **Rol requerido:** `super_admin`
- **Query params:** `?startDate=2025-01-01&endDate=2025-12-31` (opcional)
- **Descripción:** Obtiene todas las respuestas detalladas para exportación
- **Respuesta:**

```typescript
[
  {
    id: string;
    orderId: string;
    createdAt: Date;
    clientName: string;
    clientPhone: string;
    restaurantName: string;
    driverName: string;
    q1AppLoadingSpeed: number;
    // ... 11 preguntas
    averageScore: number;
    comment: string;
  }
]
```

#### **Métodos del Servicio (orders.service.ts)**

```typescript
// Estadísticas completas
async getReviewAnalytics(): Promise<any>

// Todas las respuestas con filtros
async getAllReviews(startDate?: string, endDate?: string): Promise<any[]>

// Métodos auxiliares privados
private calculateAverage(values: number[]): number
private calculateDistribution(values: number[]): any
```

---

### 🎨 Frontend (Ionic Angular)

#### **Servicio: survey-analytics.service.ts**

```typescript
export class SurveyAnalyticsService {
  // Obtener estadísticas
  getAnalytics(): Observable<ReviewAnalytics>;

  // Obtener respuestas detalladas
  getAllReviews(startDate?, endDate?): Observable<ReviewDetail[]>;

  // Exportar a CSV
  exportToCSV(reviews: ReviewDetail[]): void;
}
```

**Interfaces principales:**

- `ReviewAnalytics` - Estadísticas completas
- `ReviewDetail` - Detalle de cada respuesta
- `DimensionStats` - Estadísticas por dimensión
- `QuestionStats` - Estadísticas por pregunta

#### **Página: survey-analytics.page.ts/html/scss**

**Ubicación:** `src/app/pages/admin/survey-analytics/`

**Componentes visuales:**

1. **Resumen General**

   - Total de respuestas
   - Satisfacción general (Q10)
   - Recomendación (Q11)
   - Promedio global
   - Botón de exportación a CSV

2. **Análisis por Dimensión (5 secciones)**

   - 📱 Interfaz y Usabilidad (Q1, Q2, Q3)
   - 🎯 Precisión del Pedido (Q4, Q5)
   - 👁️ Seguimiento y Monitoreo (Q6, Q7)
   - ⏰ Puntualidad y Eficiencia (Q8, Q9)
   - ⭐ Satisfacción General (Q10, Q11)

   Cada dimensión muestra:

   - Barra de progreso con promedio
   - Lista de preguntas con badges de puntuación
   - Colores según rendimiento (verde/azul/amarillo/rojo)

3. **Últimas Encuestas**

   - 5 respuestas más recientes
   - Cliente, restaurante, fecha
   - Promedio y comentario
   - Badge de calificación

4. **Distribución de Respuestas**
   - Gráficos de barras horizontales para cada pregunta
   - Muestra cantidad de respuestas por valor (1-5 estrellas)
   - Colores según puntuación
   - Porcentajes visuales

**Métodos clave:**

```typescript
loadAnalytics()           // Cargar estadísticas
refresh(event?)           // Recargar datos
exportData()              // Exportar a CSV
getScoreColor(score)      // Color según puntuación
getScoreLabel(score)      // Etiqueta (Excelente/Bueno/etc)
formatDate(date)          // Formatear fecha
```

---

## 🎯 Funcionalidades Implementadas

### ✅ Visualización de Datos

1. **Estadísticas Generales**

   - Total de respuestas recibidas
   - Promedios globales y por dimensión
   - Últimas encuestas con detalles

2. **Análisis por Dimensión**

   - Promedio de cada dimensión (1-5)
   - Desglose de preguntas individuales
   - Barras de progreso visuales
   - Sistema de colores semafórico

3. **Distribución Detallada**
   - Gráficos de barras para cada pregunta
   - Cantidad exacta de respuestas por valor
   - Porcentajes visuales
   - 11 gráficos independientes

### ✅ Exportación de Datos

**Formato CSV generado:**

```csv
ID Encuesta,ID Pedido,Fecha,Cliente,Teléfono,Restaurante,Repartidor,Q1: Velocidad de carga,...,Q11: Recomendación,Promedio,Comentario
uuid-1,uuid-2,10/12/2025 15:30,Juan Pérez,927885314,El Buen Sabor,Carlos Ruiz,4,5,4,...,4.5,"Muy buen servicio"
```

**Características:**

- Codificación UTF-8 con BOM (para Excel)
- Escape de caracteres especiales (comas, comillas)
- Fecha en formato local (es-PE)
- Nombre de archivo con timestamp
- Compatible con Excel, Google Sheets, análisis estadístico

### ✅ Interfaz de Usuario

1. **Responsive Design**

   - Adaptable a móvil, tablet y desktop
   - Grid de Ionic con breakpoints
   - Cards táctiles

2. **Pull-to-Refresh**

   - Actualización de datos deslizando hacia abajo
   - Feedback visual con spinner

3. **Estados de Carga**

   - Spinner durante carga inicial
   - Spinner en botón de exportación
   - Mensaje cuando no hay datos

4. **Acceso desde Tab2**
   - Nueva tarjeta "Análisis de Encuestas"
   - Icono de gráfico de barras
   - Ruta: `/admin/survey-analytics`

---

## 🔐 Seguridad

- **Autenticación:** Requiere JWT válido
- **Autorización:** Solo rol `super_admin` puede acceder
- **Guards:** `authGuard` + `rolesGuard` en la ruta
- **Backend:** Decoradores `@Roles(Role.SUPER_ADMIN)`

---

## 📊 Interpretación de Datos

### Sistema de Puntuación (1-5)

| Rango     | Color              | Etiqueta   | Interpretación   |
| --------- | ------------------ | ---------- | ---------------- |
| 4.5 - 5.0 | Verde (success)    | Excelente  | Muy satisfecho   |
| 3.5 - 4.4 | Azul (primary)     | Bueno      | Satisfecho       |
| 2.5 - 3.4 | Amarillo (warning) | Regular    | Neutral          |
| 1.5 - 2.4 | Rojo claro         | Deficiente | Insatisfecho     |
| 1.0 - 1.4 | Rojo (danger)      | Muy malo   | Muy insatisfecho |

### Dimensiones Evaluadas

1. **Interfaz/Usabilidad** - Experiencia técnica de la app
2. **Precisión** - Exactitud del pedido y datos
3. **Monitoreo** - Visibilidad del proceso
4. **Puntualidad** - Tiempo de entrega y eficiencia
5. **Satisfacción General** - Evaluación global y recomendación

---

## 🚀 Uso del Sistema

### Para Administradores

1. **Acceder al Dashboard**

   ```
   Panel Admin (Tab2) → Análisis de Encuestas
   ```

2. **Ver Estadísticas**

   - El dashboard se carga automáticamente
   - Muestra datos en tiempo real
   - Pull-to-refresh para actualizar

3. **Exportar Datos**

   ```
   Clic en "Exportar a CSV" → Descarga automática
   ```

4. **Analizar Resultados**
   - Ver promedios por dimensión
   - Identificar áreas de mejora (puntajes bajos)
   - Leer comentarios de usuarios
   - Analizar distribución de respuestas

### Para Desarrollo

**Agregar más filtros:**

```typescript
// En survey-analytics.service.ts
getAllReviews(startDate?: string, endDate?: string, restaurantId?: string)
```

**Agregar gráficos adicionales:**

```typescript
// Instalar Chart.js
npm install chart.js

// Importar en survey-analytics.page.ts
import { Chart } from 'chart.js';
```

**Modificar exportación:**

```typescript
// Para exportar a Excel (XLSX)
npm install xlsx
import * as XLSX from 'xlsx';
```

---

## 📝 Archivos Modificados/Creados

### Backend

✅ `api-server/src/orders/orders.controller.ts` - Agregados 2 endpoints
✅ `api-server/src/orders/orders.service.ts` - Agregados 4 métodos

### Frontend

✅ `delivery-frontend/src/app/services/survey-analytics.service.ts` - Nuevo
✅ `delivery-frontend/src/app/pages/admin/survey-analytics/survey-analytics.page.ts` - Nuevo
✅ `delivery-frontend/src/app/pages/admin/survey-analytics/survey-analytics.page.html` - Nuevo
✅ `delivery-frontend/src/app/pages/admin/survey-analytics/survey-analytics.page.scss` - Nuevo
✅ `delivery-frontend/src/app/app.routes.ts` - Agregada ruta
✅ `delivery-frontend/src/app/tab2/tab2.page.html` - Agregada tarjeta

---

## ✅ Estado de Implementación

| Tarea                | Estado        |
| -------------------- | ------------- |
| Endpoints backend    | ✅ Completado |
| Servicio frontend    | ✅ Completado |
| Página de analytics  | ✅ Completado |
| Gráficos visuales    | ✅ Completado |
| Exportación CSV      | ✅ Completado |
| Integración Tab2     | ✅ Completado |
| Compilación backend  | ✅ Exitosa    |
| Compilación frontend | ✅ Exitosa    |

---

## 🔮 Posibles Mejoras Futuras

1. **Filtros Avanzados**

   - Por rango de fechas (DatePicker)
   - Por restaurante específico
   - Por rango de puntuación

2. **Gráficos Interactivos**

   - Chart.js o D3.js
   - Gráficos de línea (tendencias temporales)
   - Gráficos de pastel (distribución)

3. **Exportación Avanzada**

   - Formato XLSX (Excel nativo)
   - PDF con gráficos
   - JSON para APIs externas

4. **Análisis Predictivo**

   - Tendencias de satisfacción
   - Alertas de caída en puntuación
   - Comparativas por período

5. **Respuestas Individuales**
   - Tabla completa de todas las encuestas
   - Paginación y búsqueda
   - Filtros múltiples

---

## 📚 Documentación Relacionada

- `ENCUESTA_POST_IMPLEMENTATION.md` - Sistema de encuestas completo
- `ENCUESTA_FRONTEND_ACTUALIZACIÓN.md` - Migración a 11 preguntas
- `SURVEY_ANALYTICS_DASHBOARD.md` - Este documento

---

## 🎓 Uso Académico

Este sistema genera datos en formato CSV ideal para:

- **SPSS** - Análisis estadístico
- **R/Python** - Data science y visualización
- **Excel** - Tablas dinámicas y gráficos
- **Google Sheets** - Colaboración en análisis
- **Tableau/Power BI** - Dashboards avanzados

**Estructura de datos lista para:**

- Análisis de correlación
- Regresión lineal/múltiple
- Pruebas de hipótesis
- Análisis factorial
- Cálculo de alfa de Cronbach

---

## 🙏 Conclusión

El sistema de análisis de encuestas está completamente funcional y listo para producción. Proporciona todas las herramientas necesarias para:

✅ Monitorear satisfacción del cliente en tiempo real
✅ Identificar áreas de mejora
✅ Exportar datos para análisis académico
✅ Visualizar tendencias y patrones
✅ Tomar decisiones basadas en datos

**Acceso rápido:** Panel Admin → Análisis de Encuestas
**Exportación:** Un clic → CSV descargado
**Análisis:** Visual, intuitivo y completo

---

📅 **Fecha de implementación:** 10 de diciembre de 2025
👨‍💻 **Estado:** ✅ Completado y probado
🚀 **Listo para:** Producción
