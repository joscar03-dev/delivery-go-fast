# 🔧 Solución: Error "SMS unable to be sent until this region enabled"

## ❌ Error Actual

```
Firebase: SMS unable to be sent until this region enabled by the app developer.
(auth/operation-not-allowed)
```

## 🔍 Causa

Firebase bloquea por defecto el envío de SMS a ciertas regiones (países) hasta que las habilites explícitamente. En tu caso, **Perú (+51) no está habilitado**.

---

## ✅ Solución: Habilitar Región de Perú

### Paso 1: Ir a Firebase Console

1. Abre: https://console.firebase.google.com/
2. Selecciona tu proyecto: **delivery-go-fast**

### Paso 2: Navegar a Phone Authentication Settings

```
Firebase Console
└─> Authentication
    └─> Sign-in method
        └─> Phone (ya está habilitado)
            └─> Clic en "Phone" para ver configuración
                └─> Clic en ⚙️ (Settings/Configuración) en la esquina superior derecha
```

**O directamente**:

```
Firebase Console
└─> Authentication
    └─> Settings (pestaña en la parte superior)
        └─> User actions (en el menú lateral)
            └─> SMS regions
```

### Paso 3: Configurar Regiones SMS

Verás una de estas opciones:

#### Opción A: "Allow all regions" (Recomendado para desarrollo)

```
☑️ Allow all regions
```

✅ **Ventajas**:

- Funciona con cualquier país
- No hay que configurar nada más
- Ideal para desarrollo y testing

⚠️ **Desventajas**:

- Puede generar costos si usuarios de otros países usan la app
- Menos control sobre el uso

#### Opción B: "Allow specific regions" (Recomendado para producción)

```
☑️ Allow specific regions

Search regions:
[Peru ✓]
[Add more countries as needed]
```

✅ **Ventajas**:

- Control total sobre qué países pueden usar SMS
- Evita costos inesperados
- Más seguro

⚠️ **Desventajas**:

- Requiere configurar cada país manualmente

### Paso 4: Guardar Cambios

1. Clic en **"Save"** o **"Guardar"**
2. Espera 1-2 minutos para que los cambios se propaguen

---

## 🧪 Verificación

### Test Rápido en la Consola del Navegador

Después de habilitar la región:

1. Refresca tu aplicación (F5)
2. Ve al perfil
3. Clic "Agregar Teléfono"
4. Ingresa: `+51927885314`
5. Clic "Enviar Código"

**Resultado esperado**:

```
✅ reCAPTCHA resuelto
✅ OTP enviado exitosamente
✅ Deberías recibir SMS en ~30 segundos
```

**Si aún falla**, verifica:

### Checklist de Verificación

- [ ] La región Perú (+51) está habilitada en Firebase
- [ ] Esperaste 1-2 minutos después de guardar
- [ ] Refrescaste la aplicación (F5)
- [ ] El número tiene formato correcto: `+51XXXXXXXXX` (9 dígitos después de +51)
- [ ] Tienes crédito en Firebase (cuenta Blaze con billing habilitado)

---

## 💰 Verificar Billing (Importante)

### ⚠️ IMPORTANTE: Firebase SMS requiere cuenta de pago

Firebase NO enviará SMS en el plan gratuito (Spark). Necesitas:

### Paso 1: Verificar tu Plan

```
Firebase Console
└─> ⚙️ Project Settings
    └─> Usage and billing
        └─> Details
```

Deberías ver:

```
Plan: Blaze (Pay as you go)
```

Si ves:

```
Plan: Spark (Free)
```

**Entonces debes UPGRADE a Blaze**.

### Paso 2: Upgrade a Plan Blaze

```
Firebase Console
└─> ⚙️ Project Settings
    └─> Usage and billing
        └─> Details
            └─> Clic "Modify Plan"
                └─> Seleccionar "Blaze"
                    └─> Agregar método de pago
```

### Costos de SMS

**Perú (+51)**:

- **Costo por SMS**: ~$0.0140 USD (1.4 centavos)
- **100 SMS**: ~$1.40 USD
- **1000 SMS**: ~$14.00 USD

**Cuota gratuita**:

- Firebase NO tiene cuota gratuita para SMS
- Cada SMS se cobra desde el primero

**Recomendación**:

- Usa **números de prueba** durante desarrollo (gratis, sin cargo)
- Reserva SMS reales para testing final y producción

---

## 🧪 Usar Números de Prueba (Desarrollo)

Para evitar costos durante desarrollo:

### Paso 1: Configurar Número de Prueba

```
Firebase Console
└─> Authentication
    └─> Sign-in method
        └─> Phone
            └─> Phone numbers for testing
                └─> Add phone number
```

### Paso 2: Agregar Número

```
Phone number: +51999999999
Verification code: 123456
```

Clic "Add"

### Paso 3: Usar en tu App

```javascript
// En tu app, usa el número de prueba
Phone: +51999999999;

// Firebase NO enviará SMS
// Pero puedes usar el código: 123456
// Sin cargo, sin límites
```

✅ **Ventajas**:

- **Gratis** (sin cargo)
- **Sin límites** de uso
- **Instantáneo** (no esperas SMS)
- Ideal para **desarrollo** y **testing**

---

## 🔄 Flujo Completo de Testing

### Para Desarrollo (Con número de prueba)

```
1. Configurar número de prueba: +51999999999 → 123456
2. Habilitar región Perú (+51)
3. NO necesitas plan Blaze para números de prueba
4. En tu app: ingresar +51999999999
5. Usar código: 123456
6. ✅ Funciona sin costo
```

### Para Producción (Con números reales)

```
1. Habilitar región Perú (+51)
2. Upgrade a plan Blaze
3. Agregar método de pago
4. En tu app: ingresar +51927885314 (tu número real)
5. Esperar SMS (~30 segundos)
6. Ingresar código recibido
7. ✅ Funciona (con costo de ~$0.014 por SMS)
```

---

## 🎯 Recomendación para Tu Caso

### Opción 1: Testing Gratis (Recomendado para ahora)

```bash
# 1. Habilitar región Perú
Firebase Console → Authentication → Settings → SMS regions → Peru

# 2. Agregar número de prueba
Firebase Console → Authentication → Phone → Testing
Phone: +51999999999
Code: 123456

# 3. Probar en tu app
Phone: +51999999999
OTP: 123456
✅ Sin costo, sin billing
```

### Opción 2: Testing Real (Requiere billing)

```bash
# 1. Habilitar región Perú
Firebase Console → Authentication → Settings → SMS regions → Peru

# 2. Upgrade a Blaze
Firebase Console → Settings → Billing → Modify Plan → Blaze

# 3. Agregar tarjeta de crédito/débito

# 4. Probar en tu app
Phone: +51927885314 (tu número real)
OTP: (el que recibas por SMS)
✅ Costo: ~$0.014 USD por SMS
```

---

## 📝 Resumen de Pasos

### Mínimo Necesario (Para que funcione):

1. ✅ Habilitar región **Perú (+51)** en Firebase
2. ✅ Esperar 1-2 minutos
3. ✅ Refrescar tu app (F5)

### Para Testing Sin Costo:

4. ✅ Agregar número de prueba: `+51999999999` → `123456`
5. ✅ Usar ese número en tu app

### Para Producción:

6. ✅ Upgrade a plan **Blaze**
7. ✅ Agregar método de pago
8. ✅ Usar números reales

---

## ❓ FAQ

### Q: ¿Por qué no funciona con mi número real?

**A**: Probablemente:

1. La región Perú no está habilitada → Solución: Habilitarla
2. No tienes plan Blaze → Solución: Upgrade a Blaze
3. No tienes método de pago → Solución: Agregar tarjeta

### Q: ¿Puedo probar sin pagar?

**A**: SÍ, usando **números de prueba**:

- Agrega `+51999999999` → `123456` en Firebase
- Úsalo en tu app
- Sin costo, sin límites

### Q: ¿Cuánto cuesta en producción?

**A**:

- **SMS en Perú**: ~$0.014 USD cada uno
- **100 usuarios**: ~$1.40 USD
- **1000 usuarios**: ~$14.00 USD

### Q: ¿Hay cuota gratuita?

**A**: NO, Firebase SMS no tiene cuota gratuita. Cada SMS se cobra desde el primero.

### Q: ¿Cómo evito costos en desarrollo?

**A**: Usa **números de prueba**. Son completamente gratis y sin límite.

---

## ✅ Siguiente Paso

**Ahora mismo**:

1. Ve a Firebase Console
2. Habilita la región **Perú**
3. (Opcional) Agrega número de prueba `+51999999999` → `123456`
4. Espera 1-2 minutos
5. Refresca tu app y prueba de nuevo

**Luego de verificar que funciona**:

- Si planeas usar en producción → Upgrade a Blaze
- Si solo es desarrollo → Quédate con números de prueba

---

**Última actualización**: 8 de noviembre de 2025  
**Estado**: ⚠️ Requiere habilitar región Perú en Firebase
