# 📍 Sistema de Direcciones Predeterminadas - Explicación

## 🎯 Cómo Funciona

### Backend (address.service.ts)

El backend **maneja automáticamente** la lógica de direcciones predeterminadas:

```typescript
// Cuando creas o actualizas una dirección como predeterminada
if (createAddressDto.isDefault) {
  // 1️⃣ Primero: Desactiva TODAS las direcciones predeterminadas del usuario
  await this.addressRepository.update({ user: { id: userId }, isDefault: true }, { isDefault: false });

  // 2️⃣ Luego: Guarda la nueva dirección como predeterminada
  // Solo puede haber UNA dirección con isDefault = true por usuario
}
```

### ✅ Comportamiento Correcto

**Escenario 1: Primera dirección**

```
Usuario sin direcciones
  ↓
Marca nueva dirección como predeterminada
  ↓
Se guarda como isDefault = true ✅
```

**Escenario 2: Ya existe una predeterminada**

```
Dirección A: isDefault = true (actual)
  ↓
Usuario marca Dirección B como predeterminada
  ↓
Backend: isDefault = false para Dirección A
Backend: isDefault = true para Dirección B ✅
  ↓
Resultado: Solo B es predeterminada
```

---

## 🔧 Mejoras Implementadas

### 1. Mejor Manejo de Errores

**ANTES:**

```typescript
catch (error: any) {
  this.errorMessage = error?.error?.message || 'Error al guardar';
}
```

**AHORA:**

```typescript
catch (error: any) {
  console.error('❌ Error saving address:', error);

  let errorMsg = 'Error al guardar la dirección';

  if (error?.error?.message) {
    errorMsg = error.error.message;
  } else if (error?.status === 400) {
    errorMsg = 'Datos inválidos. Por favor verifica los campos.';
  } else if (error?.status === 409) {
    errorMsg = 'Ya existe una dirección predeterminada. Esta será actualizada automáticamente.';
  } else if (error?.status === 500) {
    errorMsg = 'Error del servidor. Por favor intenta nuevamente.';
  }

  this.errorMessage = errorMsg;
}
```

### 2. Mensaje Informativo en el Toggle

**UI Mejorada:**

```html
<ion-item lines="none">
  <ion-label>
    <h3>Marcar como dirección predeterminada</h3>
    <p>Esta será la dirección que aparecerá por defecto en tus pedidos</p>

    <!-- ✅ NUEVO: Mensaje cuando el toggle está activado -->
    <p class="note" *ngIf="addressForm.get('isDefault')?.value">
      <ion-icon name="information-circle-outline"></ion-icon>
      Si ya tienes otra dirección predeterminada, será reemplazada automáticamente
    </p>
  </ion-label>
  <ion-toggle formControlName="isDefault" color="primary"></ion-toggle>
</ion-item>
```

### 3. Logs de Debugging

```typescript
console.log("💾 Guardando dirección:", formData);

if (this.isEdit) {
  console.log("✏️ Actualizando dirección:", this.address.id);
} else {
  console.log("➕ Creando nueva dirección");
}

console.log("✅ Dirección guardada exitosamente:", savedAddress);
```

---

## 🧪 Cómo Probar

### Test 1: Primera Dirección Predeterminada

1. Usuario sin direcciones previas
2. Crear nueva dirección
3. ✅ Activar toggle "Dirección predeterminada"
4. Guardar
5. **Resultado esperado:** Se guarda con `isDefault = true`

### Test 2: Cambiar Dirección Predeterminada

**Setup:**

- Dirección A: "Casa" - isDefault = true
- Dirección B: "Trabajo" - isDefault = false

**Pasos:**

1. Editar Dirección B
2. ✅ Activar toggle "Dirección predeterminada"
3. Guardar

**Resultado esperado:**

- Dirección A: isDefault = false (automáticamente)
- Dirección B: isDefault = true ✅

**Verifica en consola:**

```
💾 Guardando dirección: { ..., isDefault: true }
✏️ Actualizando dirección: uuid-de-direccion-b
✅ Dirección guardada exitosamente: { ..., isDefault: true }
```

### Test 3: Crear Segunda Dirección Predeterminada

**Setup:**

- Dirección A: "Casa" - isDefault = true

**Pasos:**

1. Crear nueva dirección
2. ✅ Activar toggle "Dirección predeterminada"
3. **Ver mensaje informativo:** "Si ya tienes otra dirección predeterminada, será reemplazada automáticamente"
4. Guardar

**Resultado esperado:**

- Dirección A: isDefault = false (automáticamente)
- Dirección B: isDefault = true ✅

---

## 🐛 Posibles Errores y Soluciones

### Error 1: "Cannot set multiple default addresses"

**Causa:** Constraint de base de datos bloqueando múltiples defaults

**Solución:**

```sql
-- Verificar si existe constraint único
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'addresses'::regclass;

-- Si existe, eliminar el constraint
ALTER TABLE addresses DROP CONSTRAINT IF EXISTS unique_default_per_user;
```

### Error 2: Todas las direcciones quedan con isDefault = false

**Causa:** La actualización no está funcionando en el backend

**Debug:**

```typescript
// En address.service.ts (backend)
async update(id: string, userId: string, updateAddressDto: UpdateAddressDto) {
  console.log('🔍 Updating address:', id);
  console.log('🔍 isDefault value:', updateAddressDto.isDefault);

  if (updateAddressDto.isDefault === true) {
    console.log('🔄 Desactivando otras direcciones predeterminadas...');

    const result = await this.addressRepository.update(
      { user: { id: userId }, isDefault: true },
      { isDefault: false }
    );

    console.log('✅ Direcciones actualizadas:', result.affected);
  }

  // ... resto del código
}
```

### Error 3: Toggle no muestra el estado correcto

**Causa:** FormControl no se inicializa con el valor de la dirección

**Verificar:**

```typescript
// address-form.component.ts
private initForm() {
  this.addressForm = this.fb.group({
    // ... otros campos
    isDefault: [this.address?.isDefault ?? false], // ✅ Usar valor de la dirección
  });

  console.log('📋 Form initialized with isDefault:', this.address?.isDefault);
}
```

---

## 📊 Flujo Completo

```
┌─────────────────────────────────────────┐
│ Usuario activa toggle "Predeterminada" │
└───────────────┬─────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────┐
│ addressForm.get('isDefault').value = true │
└───────────────┬───────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│ Mensaje aparece: "Si ya tienes otra..."    │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌────────────────────────────────────┐
│ Usuario hace click en "Guardar"   │
└───────────────┬────────────────────┘
                │
                ▼
┌──────────────────────────────────────────┐
│ Frontend: POST/PUT a /users/addresses    │
│ Body: { ..., isDefault: true }           │
└───────────────┬──────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│ Backend: Recibe request                     │
│ if (dto.isDefault === true) {               │
│   // Desactivar otras                       │
│   UPDATE addresses                          │
│   SET is_default = false                    │
│   WHERE user_id = X AND is_default = true   │
│ }                                            │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│ Backend: Guardar dirección actual   │
│ INSERT/UPDATE con isDefault = true  │
└───────────────┬─────────────────────┘
                │
                ▼
┌──────────────────────────────────────┐
│ Frontend: Recibe respuesta 200 OK   │
│ Modal se cierra                      │
│ Lista de direcciones se recarga      │
└──────────────────────────────────────┘
```

---

## ✅ Checklist de Verificación

- [ ] Mensaje informativo aparece cuando toggle está activado
- [ ] Logs de debugging aparecen en consola
- [ ] Solo una dirección tiene `isDefault = true` por usuario
- [ ] Al cambiar predeterminada, la anterior se desactiva
- [ ] Error messages son claros y descriptivos
- [ ] UI muestra el icono de información
- [ ] Backend actualiza correctamente la base de datos

---

## 📝 Notas Técnicas

1. **No hay constraint único en DB**: La lógica está en el servicio, no en la base de datos
2. **Race conditions**: Si dos requests llegan simultáneamente, el último gana
3. **Transacciones**: Idealmente usar transacciones para garantizar atomicidad
4. **Cache**: Recargar lista después de guardar para ver cambios

### Mejora Futura (Opcional)

Usar transacciones en el backend:

```typescript
async update(id: string, userId: string, dto: UpdateAddressDto) {
  return await this.dataSource.transaction(async manager => {
    if (dto.isDefault === true) {
      // Desactivar otras en la misma transacción
      await manager.update(Address,
        { user: { id: userId }, isDefault: true },
        { isDefault: false }
      );
    }

    // Actualizar dirección actual
    const address = await manager.findOne(Address, { where: { id } });
    // ... actualizar campos
    return await manager.save(address);
  });
}
```

Esto garantiza que no queden múltiples direcciones predeterminadas en caso de errores.
