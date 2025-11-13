# 🗺️ GUÍA RÁPIDA: Configurar Tu Zona de Cobertura

## 🎯 Paso 1: Definir el Polígono de Cobertura

### Opción A: Usar geojson.io (MÁS FÁCIL)

1. **Abrir la herramienta**:

   - Ve a [https://geojson.io](https://geojson.io)

2. **Navegar a tu ciudad**:

   - Usa el buscador o navega manualmente
   - Acércate al área donde operas

3. **Dibujar la zona de cobertura**:

   - Haz clic en el icono de **polígono** (🔷) en la barra lateral derecha
   - Haz clic en el mapa para marcar cada punto del perímetro
   - Cierra el polígono haciendo clic en el primer punto

4. **Copiar el GeoJSON**:

   - El código se genera automáticamente en el panel derecho
   - Copia TODO el JSON

5. **Actualizar el archivo**:
   - Abre `api-server/src/geolocation/coverage.geojson`
   - Reemplaza todo el contenido con el JSON copiado
   - Guarda el archivo

### Opción B: Editar Manualmente

Edita `api-server/src/geolocation/coverage.geojson`:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "Zona de Cobertura - Tu Ciudad",
        "description": "Área donde hacemos delivery"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [-77.0428, -12.0464], // Punto 1: [LONGITUD, LATITUD]
            [-77.0528, -12.0564], // Punto 2
            [-77.0328, -12.0664], // Punto 3
            [-77.0228, -12.0564], // Punto 4
            [-77.0428, -12.0464] // Volver al primer punto (cerrar)
          ]
        ]
      }
    }
  ]
}
```

**⚠️ IMPORTANTE**:

- El formato es `[LONGITUD, LATITUD]` (al revés de lo normal)
- El primer y último punto DEBEN ser iguales (para cerrar el polígono)

---

## 🧪 Paso 2: Probar el Sistema

### Prueba desde Terminal

```bash
# Ir a la carpeta del backend
cd api-server

# Ejecutar script de prueba
node test-geofencing.js
```

**Salida esperada:**

```
🧪 PRUEBA DE SISTEMA DE GEOFENCING

📍 Probando: Centro de la zona de cobertura
   ✅ PASÓ - Resultado esperado

📍 Probando: Fuera de la zona (norte)
   ✅ PASÓ - Resultado esperado

📊 RESUMEN DE PRUEBAS:
   ✅ Pasadas: 4
   ❌ Falladas: 0

🎉 ¡Todas las pruebas pasaron exitosamente!
```

### Prueba desde Postman/cURL

```bash
# Punto DENTRO de la zona
curl -X POST http://localhost:3000/api/geolocation/check-coverage \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": -12.0500,
    "longitude": -77.0400
  }'

# Respuesta:
{
  "isInCoverage": true,
  "message": "La ubicación está dentro de la zona de cobertura"
}
```

---

## 📱 Paso 3: Probar desde la App

### 1. Reiniciar el Backend

```bash
cd api-server
npm run start:dev
```

**Busca en los logs:**

```
✅ [GeolocationService] Polígono de cobertura cargado exitosamente
```

### 2. Agregar Dirección de Prueba DENTRO

1. Abrir la app en el emulador/dispositivo
2. Ir a **Mi Cuenta** → **Mis Direcciones**
3. Agregar dirección **NUEVA**:
   - **Calle**: "Av. Principal 123"
   - **Ciudad**: Tu ciudad
   - Marcar ubicación en el mapa **DENTRO** del polígono dibujado
4. Guardar

### 3. Intentar Hacer Pedido

1. Agregar items al carrito
2. Ir a **Checkout**
3. Seleccionar la dirección creada
4. Intentar confirmar pedido
5. **Resultado esperado**: ✅ Permite confirmar

### 4. Agregar Dirección de Prueba FUERA

1. Agregar otra dirección nueva
2. Marcar ubicación en el mapa **FUERA** del polígono
3. Ir a checkout
4. Seleccionar esta dirección
5. Intentar confirmar pedido
6. **Resultado esperado**: ❌ Muestra alerta "⚠️ Fuera de zona de cobertura"

---

## 🔧 Ajustar el Polígono

Si necesitas cambiar la zona:

1. Ve a [geojson.io](https://geojson.io)
2. Arrastra el archivo `coverage.geojson` al navegador
3. Edita el polígono:
   - Arrastra los puntos existentes
   - Agrega nuevos puntos (clic en la línea)
   - Elimina puntos (clic derecho)
4. Copia el nuevo GeoJSON
5. Reemplaza el archivo
6. **Reinicia el backend** para cargar los cambios

---

## 📊 Verificar Logs

### Backend (api-server)

Al iniciar, deberías ver:

```
✅ [GeolocationService] Polígono de cobertura cargado exitosamente
```

Al hacer checkout:

```
✅ [OrdersService] Validación de cobertura: (lat, lng) - Dentro
```

O si está fuera:

```
❌ [OrdersService] Validación de cobertura: (lat, lng) - Fuera
```

---

## ❓ Preguntas Frecuentes

### ¿Qué pasa si no configuro el polígono?

El sistema permite **todos los pedidos** por defecto y muestra un warning:

```
⚠️ [GeolocationService] Sistema de geofencing deshabilitado
```

### ¿Puedo tener múltiples zonas de cobertura?

Sí, agrega más features al GeoJSON:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "name": "Zona Centro" },
      "geometry": { ... polígono 1 ... }
    },
    {
      "type": "Feature",
      "properties": { "name": "Zona Norte" },
      "geometry": { ... polígono 2 ... }
    }
  ]
}
```

Y modifica `loadCoveragePolygon()` en `geolocation.service.ts` para iterar sobre todas las features.

### ¿Cómo obtengo las coordenadas de mi ciudad?

1. Abre Google Maps
2. Busca tu ciudad
3. Haz clic derecho en el mapa → "¿Qué hay aquí?"
4. Copia las coordenadas (formato: `-12.046373, -77.042754`)
5. Usa esas coordenadas en geojson.io

---

## 🚀 Deploy a Producción

### Backend

```bash
cd api-server
npm run build

# Verificar que coverage.geojson se copió al dist/
ls dist/geolocation/coverage.geojson
```

### VPS

Sube los archivos y reinicia el servidor:

```bash
pm2 restart api-server
pm2 logs api-server --lines 50  # Buscar mensaje de carga exitosa
```

---

## ✅ Checklist Final

- [ ] Polígono dibujado en geojson.io con tu zona real
- [ ] Archivo `coverage.geojson` actualizado
- [ ] Backend reiniciado y muestra "✅ Polígono de cobertura cargado"
- [ ] Script `test-geofencing.js` ejecutado exitosamente
- [ ] Probado desde la app con dirección dentro → permite pedido
- [ ] Probado desde la app con dirección fuera → bloquea pedido
- [ ] Deploy a VPS completado

---

**¿Necesitas ayuda?** Revisa `GEOFENCING_IMPLEMENTACION_COMPLETA.md` para más detalles técnicos.
