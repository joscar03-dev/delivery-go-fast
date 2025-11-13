# 📍 Sistema de Selección de Ubicación GPS en Direcciones

## ✅ ¿Qué se implementó?

Se mejoró el componente `address-form` para permitir que los usuarios **capturen su ubicación GPS** al agregar una dirección.

---

## 🎯 Funcionalidades

### 1. Botón "Usar mi ubicación actual"

- Usa **Capacitor Geolocation** para obtener coordenadas precisas
- Solicita permisos de ubicación automáticamente
- Muestra feedback visual con toast notifications
- Loading spinner mientras obtiene la ubicación

### 2. Campos Manuales de Coordenadas

- Permiten ingresar latitud/longitud manualmente
- Útil si el GPS no funciona o para ajustar la ubicación
- Formato decimal: `-5.636`, `-78.532`

### 3. Validación de Cobertura (Automática)

- Al confirmar pedido en checkout, valida que la dirección esté dentro de la zona
- Usa el sistema de geofencing implementado
- Bloquea pedidos fuera de zona

---

## 📱 Cómo usar (Para el usuario)

### Paso 1: Agregar Nueva Dirección

1. Ir a **Mi Cuenta** → **Mis Direcciones**
2. Tap en **"Nueva Dirección"** o editar una existente
3. Llenar los campos básicos:
   - Tipo: Casa / Trabajo / Otro
   - Calle / Dirección
   - Ciudad
   - Código Postal
   - Referencia (opcional)

### Paso 2: Capturar Ubicación GPS

**Opción A: Ubicación Automática (Recomendado)**

1. Scroll hasta la sección **"Ubicación GPS"**
2. Tap en el botón **"Usar mi ubicación actual"**
3. Cuando el sistema pida permisos, tap en **"Permitir"**
4. Esperar unos segundos (verás un spinner)
5. ✅ Verás un mensaje verde con las coordenadas detectadas

**Opción B: Ingreso Manual**

1. En la sección **"Ubicación GPS"**
2. Ingresar manualmente:
   - **Latitud**: Ej. `-5.636`
   - **Longitud**: Ej. `-78.532`

**¿Cómo obtener coordenadas manualmente?**

- Abrir Google Maps
- Buscar tu dirección
- Mantener presionado en el punto exacto
- Copiar las coordenadas que aparecen

### Paso 3: Guardar

1. Tap en el ícono **💾** (guardar) en la esquina superior derecha
2. Si todo está correcto, la dirección se guardará

---

## 🔧 Flujo Técnico

### Frontend (address-form.component.ts)

```typescript
async getCurrentLocation() {
  // 1. Verificar permisos
  const permissionStatus = await Geolocation.checkPermissions();

  // 2. Solicitar si no están otorgados
  if (permissionStatus.location !== 'granted') {
    await Geolocation.requestPermissions();
  }

  // 3. Obtener ubicación con alta precisión
  const position = await Geolocation.getCurrentPosition({
    enableHighAccuracy: true,
    timeout: 10000,
  });

  // 4. Actualizar formulario
  this.addressForm.patchValue({
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  });
}
```

### Backend (address.service.ts)

Cuando se guarda la dirección:

```typescript
POST /api/users/addresses
{
  "street": "Av. Principal 123",
  "city": "Jaén",
  "postalCode": "06800",
  "latitude": -5.636,
  "longitude": -78.532
}
```

El backend convierte a formato PostGIS Point:

```sql
INSERT INTO addresses (location, ...)
VALUES (
  ST_SetSRID(ST_MakePoint(-78.532, -5.636), 4326),  -- [lng, lat]
  ...
);
```

### Validación de Cobertura (checkout)

Al confirmar pedido:

```typescript
// 1. Frontend extrae coordenadas de la dirección seleccionada
const [lng, lat] = selectedAddress.location.coordinates;

// 2. Valida con el backend
const coverageCheck = await geolocationService.checkCoverage(lat, lng);

// 3. Si está fuera, muestra alerta
if (!coverageCheck.isInCoverage) {
  alert("⚠️ Fuera de zona de cobertura");
}
```

---

## 🎨 Interfaz de Usuario

### Sección de Ubicación GPS

```
┌─────────────────────────────────────────────┐
│  📍 Ubicación GPS (opcional pero recomendado) │
├─────────────────────────────────────────────┤
│                                             │
│  ℹ️ Esto ayuda a los repartidores a        │
│  encontrar tu dirección y permite validar   │
│  la zona de cobertura                       │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ 📍 Usar mi ubicación actual         │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌────────────┐  ┌────────────┐            │
│  │ Latitud    │  │ Longitud   │            │
│  │ -5.636     │  │ -78.532    │            │
│  └────────────┘  └────────────┘            │
│                                             │
│  ✅ Ubicación registrada: -5.636, -78.532  │
└─────────────────────────────────────────────┘
```

---

## ⚠️ Permisos Necesarios

### Android (AndroidManifest.xml)

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

**Ya están agregados** en el proyecto.

### iOS (Info.plist)

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Necesitamos tu ubicación para ayudarte a agregar direcciones de entrega precisas</string>
```

---

## 🧪 Pruebas

### Probar Ubicación GPS

1. **En Emulador Android**:

   - Android Studio → Extended Controls (...)
   - Location → Establecer coordenadas manualmente
   - O cargar un archivo GPX/KML

2. **En Dispositivo Real**:
   - Activar GPS en el dispositivo
   - Dar permisos cuando se soliciten
   - Ir al aire libre si la señal es débil

### Probar Validación de Cobertura

1. Agregar dirección **DENTRO** del polígono:

   - Coordenadas: `-5.636, -78.532` (Jaén centro)
   - Resultado: ✅ Permite pedido

2. Agregar dirección **FUERA** del polígono:
   - Coordenadas: `-5.500, -78.532` (fuera de Jaén)
   - Resultado: ❌ Bloquea pedido con alerta

---

## 📊 Estados y Mensajes

| Estado              | Mensaje                                   | Color    |
| ------------------- | ----------------------------------------- | -------- |
| Cargando ubicación  | "Obteniendo ubicación..."                 | -        |
| Ubicación detectada | "✅ Ubicación detectada: -5.636, -78.532" | Verde    |
| Error de permisos   | "Se necesitan permisos de ubicación..."   | Amarillo |
| Error de GPS        | "No se pudo obtener la ubicación: ..."    | Rojo     |

---

## 🔍 Troubleshooting

### "No se pudo obtener la ubicación"

**Causas**:

- GPS desactivado en el dispositivo
- Permisos no otorgados
- Señal GPS débil (dentro de edificios)
- Timeout (10 segundos)

**Solución**:

1. Verificar que el GPS esté activado
2. Dar permisos cuando se soliciten
3. Ir al aire libre
4. Si falla, usar ingreso manual

### "Ubicación fuera de zona de cobertura"

**Causas**:

- La dirección está realmente fuera de la zona configurada
- El polígono en `coverage.geojson` está mal configurado

**Solución**:

1. Verificar las coordenadas en Google Maps
2. Ajustar el polígono si es necesario (ver `GEOFENCING_GUIA_RAPIDA.md`)
3. Usar una dirección dentro de la zona

---

## 🚀 Compilar y Probar

```bash
# Compilar frontend
cd delivery-frontend
ionic build

# Sincronizar con Android
npx cap sync android

# Abrir en Android Studio
npx cap open android

# Ejecutar en dispositivo/emulador
```

---

## 📝 Notas Importantes

1. **La ubicación GPS es opcional** pero altamente recomendada
2. **Sin GPS**, el sistema de geofencing no puede validar cobertura
3. **Con GPS**, mejora la experiencia del repartidor y valida automáticamente la zona
4. Los usuarios pueden **editar coordenadas manualmente** si el GPS no es preciso
5. Las coordenadas se almacenan en formato **PostGIS Point** en la base de datos

---

## ✅ Checklist de Funcionalidad

- [x] Botón "Usar mi ubicación actual" funcional
- [x] Solicita permisos de ubicación automáticamente
- [x] Muestra spinner durante la carga
- [x] Toast notifications con feedback
- [x] Campos manuales de lat/lng
- [x] Visualización de coordenadas detectadas
- [x] Integración con sistema de geofencing
- [x] Validación en checkout
- [x] Permisos de Android configurados
- [x] Estilos responsive y claros

---

## 🔄 Próximos Pasos

1. **Compilar el frontend**:

   ```bash
   cd delivery-frontend
   ionic build
   ```

2. **Sincronizar con Android**:

   ```bash
   npx cap sync android
   ```

3. **Probar en dispositivo**:

   - Abrir en Android Studio
   - Ejecutar en dispositivo/emulador
   - Ir a Direcciones → Nueva Dirección
   - Probar botón GPS

4. **Validar flujo completo**:
   - Crear dirección con GPS
   - Ir a checkout
   - Verificar validación de cobertura

---

**✅ El sistema está listo para compilar y probar** 📱
