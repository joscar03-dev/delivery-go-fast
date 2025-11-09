# 🧪 Configurar Número de Prueba en Firebase (SIN COSTO)

## ✅ Solución al Error: auth/billing-not-enabled

Si ves este error:

```
Firebase: Error (auth/billing-not-enabled)
```

Significa que intentas enviar SMS reales pero **no tienes billing habilitado**.

**Solución**: Usa un **número de prueba** para testear sin costo.

---

## 🎯 Paso a Paso: Configurar Número de Prueba

### Paso 1: Ir a Firebase Console

1. Abre: https://console.firebase.google.com/
2. Selecciona tu proyecto: **delivery-go-fast**

### Paso 2: Navegar a Phone Authentication

```
Firebase Console
└─> Authentication
    └─> Sign-in method
        └─> Phone (debe estar "Enabled")
            └─> Clic en "Phone" para expandir
```

### Paso 3: Buscar "Phone numbers for testing"

Baja en la página hasta ver:

```
┌─────────────────────────────────────────┐
│ Phone numbers for testing               │
│                                         │
│ Use these numbers for testing without  │
│ actually sending SMS messages.          │
│                                         │
│ [+ Add phone number]                    │
└─────────────────────────────────────────┘
```

### Paso 4: Agregar Número de Prueba

Clic en **"+ Add phone number"** o **"Agregar número de teléfono"**

Se abrirá un modal:

```
┌─────────────────────────────────────┐
│ Add phone number for testing        │
├─────────────────────────────────────┤
│                                     │
│ Phone number                        │
│ [+51999999999        ]              │
│                                     │
│ Verification code                   │
│ [123456              ]              │
│                                     │
│          [Cancel]  [Add]            │
└─────────────────────────────────────┘
```

**Valores recomendados**:

- **Phone number**: `+51999999999` (puede ser cualquier número de Perú)
- **Verification code**: `123456` (cualquier código de 6 dígitos)

Clic en **"Add"**

### Paso 5: Verificar que se agregó

Deberías ver:

```
┌─────────────────────────────────────────┐
│ Phone numbers for testing               │
│                                         │
│ +51999999999                    123456  │
│                               [Delete]  │
│                                         │
│ [+ Add phone number]                    │
└─────────────────────────────────────────┘
```

✅ **¡Listo!** Ya puedes usar este número sin costo.

---

## 🧪 Cómo Usar el Número de Prueba

### En tu Aplicación

1. Ve a tu app: http://localhost:8100
2. Login o ve al perfil
3. Clic "Agregar Teléfono"
4. **Ingresa**:
   - Código de país: `+51`
   - Número: `999999999`
5. Clic "Enviar Código"
6. **Firebase NO enviará SMS** (es gratis)
7. En el diálogo de verificación, **ingresa**: `123456`
8. ✅ **Funciona sin costo**

### Flujo Visual

```
┌─────────────────────────┐
│ Agregar Teléfono        │
├─────────────────────────┤
│ Código país:            │
│ [ +51        ]          │
│                         │
│ Número:                 │
│ [ 999999999  ]          │ ← Usa el número de prueba
│                         │
│    [Enviar Código]      │
└─────────────────────────┘

         ↓ Firebase NO envía SMS

┌─────────────────────────┐
│ Verificar Código        │
├─────────────────────────┤
│ Código enviado a:       │
│ +51999999999            │
│                         │
│ [ 123456     ]          │ ← Usa el código configurado
│                         │
│    [Verificar]          │
└─────────────────────────┘

         ↓ ✅ Verificación exitosa

┌─────────────────────────┐
│ ✅ Teléfono verificado  │
│                         │
│ Tu número:              │
│ ✓ +51999999999          │
└─────────────────────────┘
```

---

## ✅ Ventajas del Número de Prueba

| Característica | Número de Prueba    | Número Real                |
| -------------- | ------------------- | -------------------------- |
| **Costo**      | ✅ GRATIS           | ❌ ~$0.014 USD/SMS         |
| **Billing**    | ✅ No requerido     | ❌ Plan Blaze + tarjeta    |
| **SMS**        | ✅ No se envía      | ❌ Se envía (puede tardar) |
| **Código**     | ✅ Siempre el mismo | ❌ Cambia cada vez         |
| **Límites**    | ✅ Sin límite       | ❌ Cuota por proyecto      |
| **Testing**    | ✅ Ideal            | ❌ Solo para producción    |

---

## 🎯 Recomendaciones

### Para Desarrollo (Ahora)

```
✅ Usa número de prueba: +51999999999 → 123456
✅ Sin costo
✅ Sin límites
✅ Perfecto para testear
```

### Para Testing Pre-Producción

```
✅ Agrega 2-3 números de prueba más
✅ Diferentes códigos para diferentes casos
✅ Ejemplo:
   +51999999999 → 123456 (happy path)
   +51888888888 → 654321 (segundo usuario)
   +51777777777 → 111111 (tercer usuario)
```

### Para Producción (Futuro)

```
⚠️ Upgrade a plan Blaze
⚠️ Agregar método de pago
✅ Usar números reales
✅ Remover números de prueba (seguridad)
```

---

## 🔒 Seguridad

### ⚠️ IMPORTANTE: Remover en Producción

Antes de lanzar a producción:

1. **Elimina todos los números de prueba**

   - Firebase Console → Authentication → Phone → Testing
   - Clic "Delete" en cada número de prueba

2. **¿Por qué?**

   - Cualquiera podría usar +51999999999
   - No requiere SMS real
   - Brecha de seguridad

3. **En producción**:
   - Solo números reales
   - SMS obligatorio
   - Sin números de prueba

---

## 💰 Comparación de Costos

### Opción 1: Números de Prueba (Ahora)

```
Costo inicial: $0 USD
Costo por verificación: $0 USD
Costo mensual: $0 USD
Plan requerido: Spark (Free)
Tarjeta requerida: No

✅ Perfecto para desarrollo
```

### Opción 2: Plan Blaze (Producción)

```
Costo inicial: $0 USD
Costo por SMS en Perú: ~$0.014 USD
Costo mensual: Variable según uso
Plan requerido: Blaze (Pay as you go)
Tarjeta requerida: Sí

Ejemplo:
- 100 usuarios/mes: ~$1.40 USD
- 500 usuarios/mes: ~$7.00 USD
- 1000 usuarios/mes: ~$14.00 USD

✅ Para producción con números reales
```

---

## 🧪 Testing Completo

### Casos de Prueba

#### Test 1: Registro con Número de Prueba

```
1. Ve a /auth/login
2. Clic "Iniciar con Teléfono"
3. Ingresa: +51999999999
4. Código: 123456
5. ✅ Registro exitoso sin SMS
```

#### Test 2: Agregar Teléfono al Perfil

```
1. Login con email
2. Ve a /tabs/account
3. Clic "Agregar Teléfono"
4. Ingresa: +51999999999
5. Código: 123456
6. ✅ Teléfono agregado sin SMS
```

#### Test 3: Login con Número de Prueba

```
1. Logout
2. Ve a /auth/login
3. Clic "Iniciar con Teléfono"
4. Ingresa: +51999999999
5. Código: 123456
6. ✅ Login exitoso
```

---

## ❓ FAQ

### Q: ¿Puedo usar mi número real ahora?

**A**: No, necesitas upgrade a Blaze. Usa número de prueba por ahora.

### Q: ¿Cuántos números de prueba puedo agregar?

**A**: Hasta 10 números por proyecto. Suficiente para testing.

### Q: ¿El código puede ser diferente?

**A**: Sí, cada número puede tener su propio código. Ejemplos:

- +51999999999 → 123456
- +51888888888 → 654321
- +51777777777 → 111111

### Q: ¿Funciona en producción?

**A**: SÍ funciona, pero NO deberías usarlo por seguridad.

### Q: ¿Puedo testear con números reales más tarde?

**A**: Sí, cuando hagas upgrade a Blaze puedes probar con números reales.

### Q: ¿El número de prueba se ve diferente en la app?

**A**: No, la app no puede distinguir entre número de prueba y real.

---

## ✅ Siguiente Paso

**AHORA MISMO**:

1. ✅ Ve a Firebase Console
2. ✅ Authentication → Sign-in method → Phone
3. ✅ Agrega número de prueba: `+51999999999` → `123456`
4. ✅ Guarda
5. ✅ Refresca tu app (F5)
6. ✅ Prueba con el número de prueba

**RESULTADO**:

```
✅ Funciona sin billing
✅ Sin costo
✅ Sin límites
✅ Listo para testear
```

**DESPUÉS** (cuando todo funcione):

- Documenta los flows
- Prueba edge cases
- Prepara para producción (Blaze)

---

**Última actualización**: 8 de noviembre de 2025  
**Estado**: ✅ Listo para testear sin costo con números de prueba
