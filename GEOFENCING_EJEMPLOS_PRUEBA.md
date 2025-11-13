# 🧪 Ejemplos de Prueba - Sistema de Geofencing

## 📌 Endpoint Público

```
POST http://localhost:3000/api/geolocation/check-coverage
Content-Type: application/json
```

---

## ✅ Caso 1: Ubicación DENTRO de la Zona

### Request

```json
{
  "latitude": -12.05,
  "longitude": -77.04
}
```

### Response (200 OK)

```json
{
  "isInCoverage": true,
  "message": "La ubicación está dentro de la zona de cobertura",
  "coordinates": {
    "latitude": -12.05,
    "longitude": -77.04
  }
}
```

### Comportamiento en la App

- ✅ Frontend: No muestra alerta
- ✅ Backend: Permite crear el pedido
- ✅ Usuario: Puede confirmar sin problemas

---

## ❌ Caso 2: Ubicación FUERA de la Zona

### Request

```json
{
  "latitude": -12.9,
  "longitude": -77.04
}
```

### Response (200 OK)

```json
{
  "isInCoverage": false,
  "message": "Lo sentimos, aún no tenemos cobertura en tu zona",
  "coordinates": {
    "latitude": -12.9,
    "longitude": -77.04
  }
}
```

### Comportamiento en la App

- ⚠️ Frontend: Muestra alerta "⚠️ Fuera de zona de cobertura"
- ❌ Backend: Rechaza el pedido con 403 Forbidden
- 🛑 Usuario: Debe cambiar dirección

---

## 🧪 Caso 3: Probar con cURL

### Ubicación Dentro

```bash
curl -X POST http://localhost:3000/api/geolocation/check-coverage \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": -12.0500,
    "longitude": -77.0400
  }'
```

### Ubicación Fuera

```bash
curl -X POST http://localhost:3000/api/geolocation/check-coverage \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": -12.9000,
    "longitude": -77.0400
  }'
```

---

## 📱 Caso 4: Probar con Postman

### Setup

1. Crear nueva request POST
2. URL: `http://localhost:3000/api/geolocation/check-coverage`
3. Headers:
   - `Content-Type`: `application/json`
4. Body (raw JSON):

```json
{
  "latitude": -12.05,
  "longitude": -77.04
}
```

5. Send

### Variables de Entorno

Crear en Postman:

- `{{api_url}}`: `http://localhost:3000`
- `{{lat_inside}}`: `-12.0500`
- `{{lng_inside}}`: `-77.0400`
- `{{lat_outside}}`: `-12.9000`
- `{{lng_outside}}`: `-77.0400`

---

## 🔧 Caso 5: Probar desde JavaScript (Node.js)

```javascript
const fetch = require("node-fetch");

async function checkCoverage(latitude, longitude) {
  const response = await fetch(
    "http://localhost:3000/api/geolocation/check-coverage",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ latitude, longitude }),
    }
  );

  const result = await response.json();
  console.log(result);
  return result;
}

// Probar dentro
checkCoverage(-12.05, -77.04);

// Probar fuera
checkCoverage(-12.9, -77.04);
```

---

## 🌐 Caso 6: Probar desde el Frontend (Angular/Ionic)

### En un servicio o componente:

```typescript
import { GeolocationService } from '../services/geolocation.service';

constructor(private geolocationService: GeolocationService) {}

async testCoverage() {
  // Probar dentro
  this.geolocationService.checkCoverage(-12.0500, -77.0400)
    .subscribe(result => {
      console.log('Dentro:', result);
      // { isInCoverage: true, message: "..." }
    });

  // Probar fuera
  this.geolocationService.checkCoverage(-12.9000, -77.0400)
    .subscribe(result => {
      console.log('Fuera:', result);
      // { isInCoverage: false, message: "..." }
    });
}
```

---

## 🐛 Caso 7: Errores Comunes

### Error: Cannot POST /api/geolocation/check-coverage

**Causa**: El backend no está corriendo o la ruta es incorrecta.

**Solución**:

```bash
cd api-server
npm run start:dev
```

### Error: "coordinates is not iterable"

**Causa**: El GeoJSON tiene formato incorrecto.

**Solución**: Validar el archivo en [geojson.io](https://geojson.io)

### Warning: "Sistema de geofencing deshabilitado"

**Causa**: No se pudo cargar `coverage.geojson`.

**Solución**: Verificar que el archivo existe y tiene formato correcto.

---

## 📊 Caso 8: Script de Prueba Automatizada

Ya existe en `api-server/test-geofencing.js`:

```bash
cd api-server
node test-geofencing.js
```

**Salida esperada:**

```
🧪 PRUEBA DE SISTEMA DE GEOFENCING

📍 Probando: Centro de la zona de cobertura
   Coordenadas: (-12.05, -77.038)
   Respuesta: { isInCoverage: true, message: "..." }
   ✅ PASÓ - Resultado esperado

📍 Probando: Fuera de la zona (norte)
   Coordenadas: (-11.9, -77.04)
   Respuesta: { isInCoverage: false, message: "..." }
   ✅ PASÓ - Resultado esperado

📊 RESUMEN DE PRUEBAS:
   ✅ Pasadas: 4
   ❌ Falladas: 0

🎉 ¡Todas las pruebas pasaron exitosamente!
```

---

## 🗺️ Caso 9: Obtener Coordenadas de Prueba

### Desde Google Maps

1. Abre [Google Maps](https://maps.google.com)
2. Navega a tu ciudad
3. Haz clic derecho en el mapa
4. Selecciona "¿Qué hay aquí?"
5. Copia las coordenadas: `-12.046373, -77.042754`

### Desde geojson.io

1. Abre [geojson.io](https://geojson.io)
2. Dibuja tu polígono
3. Las coordenadas aparecen en el JSON del panel derecho

---

## 🔄 Caso 10: Flujo Completo de Pedido

### Escenario: Usuario intenta hacer pedido FUERA de zona

1. **Usuario**: Agrega dirección fuera de zona

   ```json
   {
     "street": "Calle Lejana 999",
     "latitude": -12.9,
     "longitude": -77.04
   }
   ```

2. **Usuario**: Agrega items al carrito

3. **Usuario**: Va a checkout y selecciona la dirección

4. **Frontend**: Valida cobertura (UX)

   ```typescript
   checkCoverage(-12.9, -77.04);
   // Returns: { isInCoverage: false }
   ```

5. **Frontend**: Muestra alerta

   ```
   ⚠️ Fuera de zona de cobertura
   Lo sentimos, aún no tenemos cobertura en tu zona
   [Cambiar dirección] [OK]
   ```

6. **Usuario**: Ignora alerta e intenta confirmar (si logra bypassear el cliente)

7. **Backend**: Valida cobertura (AUTORIDAD)

   ```typescript
   checkCoverage(-12.9, -77.04);
   // Throws ForbiddenException
   ```

8. **Backend**: Responde

   ```json
   {
     "statusCode": 403,
     "message": "Lo sentimos, aún no tenemos cobertura en tu zona..."
   }
   ```

9. **Usuario**: Ve error y debe cambiar dirección

---

## ✅ Checklist de Pruebas

Antes de considerar el sistema listo:

- [ ] Endpoint responde correctamente en Postman
- [ ] Script `test-geofencing.js` pasa todas las pruebas
- [ ] Frontend muestra alerta con dirección fuera de zona
- [ ] Frontend permite pedido con dirección dentro de zona
- [ ] Backend rechaza pedido con dirección fuera (403)
- [ ] Backend permite pedido con dirección dentro (201)
- [ ] Logs del backend muestran "✅ Polígono de cobertura cargado"

---

**Siguiente paso**: Configurar tu polígono real en `coverage.geojson` siguiendo `GEOFENCING_GUIA_RAPIDA.md`
