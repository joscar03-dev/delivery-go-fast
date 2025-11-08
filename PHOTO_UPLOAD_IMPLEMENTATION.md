# Sistema de Carga de Fotos - Solicitud de Conductores

## 📸 Implementación Completada

Se ha implementado exitosamente la funcionalidad de carga de fotos con Capacitor Camera API para el Paso 2 del formulario de solicitud de conductores.

## 🎯 Características Implementadas

### 1. **Componente Reutilizable: `PhotoUploadComponent`**

Ubicación: `src/app/components/photo-upload/`

#### Propiedades:

- `@Input() label`: Etiqueta del campo de foto
- `@Input() photo`: URL o base64 de la foto actual
- `@Input() required`: Si el campo es obligatorio (muestra asterisco rojo)
- `@Output() photoChange`: Evento que emite la foto en formato base64

#### Funcionalidades:

- ✅ Capturar foto desde cámara
- ✅ Seleccionar foto desde galería
- ✅ Vista previa de la foto cargada
- ✅ Eliminar foto con confirmación
- ✅ Compresión automática a 1200x1200px con calidad 80%
- ✅ Overlay con botones al hacer hover (cambiar/eliminar)
- ✅ Placeholder atractivo cuando no hay foto

### 2. **Integración en Formulario de Conductor**

**Ubicación**: `src/app/driver-application/driver-application.page.ts` y `.html`

#### Fotos Requeridas:

1. **DNI** (Obligatorio) - `dniPhoto`
2. **Licencia Frente** (Obligatorio) - `licenseFrontPhoto`
3. **Licencia Reverso** (Opcional) - `licenseBackPhoto`
4. **Vehículo** (Obligatorio) - `vehiclePhoto`

#### Validación:

- Al enviar la solicitud completa (Step 2), se valida que las 3 fotos obligatorias estén cargadas
- Mensaje de error si falta alguna foto requerida
- Las fotos se guardan junto con el resto de datos del formulario

### 3. **Flujo de Datos**

```
1. Usuario toca placeholder o foto existente
2. Se abre ActionSheet con opciones: "Tomar Foto" / "Elegir de Galería"
3. Se captura/selecciona la imagen
4. Capacitor Camera comprime y convierte a Base64
5. Base64 se guarda en variable del componente
6. Al guardar/enviar, Base64 se incluye en el DTO
7. Backend guarda el Base64 en PostgreSQL (columna TEXT)
```

## 📦 Dependencias Instaladas

```bash
npm install @capacitor/camera
```

**Versión**: `@capacitor/camera@latest` (compatible con Capacitor 7)

## 🔧 Configuración de Permisos

### Android (`android/app/src/main/AndroidManifest.xml`):

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

### iOS (`ios/App/App/Info.plist`):

```xml
<key>NSCameraUsageDescription</key>
<string>La app necesita acceso a la cámara para tomar fotos de tus documentos</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>La app necesita acceso a tus fotos para seleccionar documentos</string>
```

## 🎨 Estilos y UX

### Responsive Design:

- **Móvil**: 1 columna de fotos (100% ancho)
- **Tablet/Desktop**: 2 columnas en grid

### Estados Visuales:

- **Sin foto**: Placeholder con ícono de cámara y texto "Toca para agregar foto"
- **Con foto**: Vista previa + overlay con botones al hover
- **Hover**: Borde azul en placeholder, overlay con botones en foto
- **Campo requerido**: Asterisco rojo (\*) junto al label

### Colores:

- Border sin foto: `var(--ion-color-medium)` (gris)
- Border hover: `var(--ion-color-primary)` (azul)
- Overlay: `rgba(0, 0, 0, 0.3)` (semi-transparente)

## 📝 Uso del Componente

### En cualquier formulario:

```html
<app-photo-upload
  label="Foto del DNI"
  [photo]="dniPhoto"
  [required]="true"
  (photoChange)="onPhotoChange('dniPhoto', $event)"
></app-photo-upload>
```

### En el TypeScript:

```typescript
// Variables para almacenar fotos
dniPhoto: string | undefined;

// Método para manejar cambios
onPhotoChange(photoType: string, base64: string) {
  this[photoType] = base64;
}
```

## 🔄 Backend - Cambios Realizados

### 1. **Permitir Editar en Estado PENDING_COMPLETION**

**Archivo**: `api-server/src/driver-applications/driver-applications.service.ts`

**Cambio**: Modificado el método `update()` para permitir edición en estados:

- `DRAFT` (borrador inicial)
- `PENDING_COMPLETION` (después de aprobar llamada)

```typescript
if (
  application.status !== ApplicationStatus.DRAFT &&
  application.status !== ApplicationStatus.PENDING_COMPLETION
) {
  throw new BadRequestException(
    "Solo puedes editar solicitudes en borrador o pendientes de completar"
  );
}
```

**Razón**: Los usuarios necesitan poder completar y editar el Paso 2 después de que el admin apruebe la llamada.

## 🧪 Pruebas Recomendadas

### 1. **Prueba en Emulador/Dispositivo Real**:

```bash
cd delivery-frontend
npm run build
npx cap sync
npx cap open android
```

### 2. **Casos de Prueba**:

✅ Capturar foto desde cámara
✅ Seleccionar foto desde galería
✅ Eliminar foto y volver a cargar
✅ Guardar borrador con fotos
✅ Enviar solicitud sin fotos obligatorias (debe mostrar error)
✅ Enviar solicitud completa con todas las fotos
✅ Verificar que fotos persisten al recargar la página
✅ Verificar que fotos se muestran en panel admin

### 3. **Validar Permisos**:

- Primera vez que se usa cámara/galería, debe pedir permisos
- Si usuario niega permisos, debe mostrar mensaje apropiado
- Usuario puede cambiar permisos en configuración del sistema

## 📊 Tamaño de Imágenes

### Configuración Actual:

- **Calidad**: 80% (balance entre calidad y tamaño)
- **Dimensiones máximas**: 1200x1200px
- **Formato**: Base64 con prefijo `data:image/jpeg;base64,`

### Tamaños Estimados:

- Foto comprimida: ~200-400 KB por imagen
- 4 fotos: ~800 KB - 1.6 MB total
- Almacenamiento en PostgreSQL: Columna TEXT acepta hasta 1 GB

### Optimización Futura (Opcional):

- Subir a AWS S3 / Cloudinary en lugar de Base64
- Guardar solo URL en base de datos
- Implementar lazy loading en admin panel

## 🐛 Solución de Problemas

### Error: "User cancelled photos app"

**Causa**: Usuario canceló la selección de foto
**Solución**: Este error es esperado, el componente lo maneja silenciosamente

### Error: "No camera available"

**Causa**: Dispositivo no tiene cámara (emuladores)
**Solución**: Usar "Elegir de Galería" en su lugar

### Error: "Permission denied"

**Causa**: Usuario negó permisos de cámara/galería
**Solución**: Mostrar mensaje pidiendo habilitar permisos en configuración

### Fotos muy grandes / App lenta

**Causa**: Calidad muy alta o sin compresión
**Solución**: Ajustar `quality` en Camera.getPhoto() (actual: 80)

## 📚 Referencias

- [Capacitor Camera API](https://capacitorjs.com/docs/apis/camera)
- [Ionic ActionSheet](https://ionicframework.com/docs/api/action-sheet)
- [Angular Output EventEmitter](https://angular.io/api/core/Output)

## ✨ Próximos Pasos Sugeridos

1. ✅ **Implementación completada**: Componente de fotos funcionando
2. ⏳ **Pendiente**: Probar en dispositivo real
3. ⏳ **Pendiente**: Agregar visor de fotos en modal (zoom) en admin panel
4. ⏳ **Opcional**: Migrar a S3 para mejor performance
5. ⏳ **Opcional**: Agregar edición básica de fotos (crop, rotate)

---

**Última actualización**: 7 de noviembre de 2025
**Estado**: ✅ Implementación completa y compilación exitosa
