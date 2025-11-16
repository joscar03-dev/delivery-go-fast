# 🖨️ Sistema de Impresión Térmica - Guía Completa

## 📋 Resumen

Se ha implementado un sistema completo de impresión térmica para imprimir órdenes en ticketeras/impresoras térmicas mediante Bluetooth.

---

## 🎯 Características

✅ **Conexión Bluetooth** con impresoras térmicas (58mm y 80mm)
✅ **Formato ESC/POS** estándar (compatible con la mayoría de impresoras)
✅ **Tickets profesionales** con:

- Logo y encabezado del restaurante
- Número de orden
- Información del cliente (nombre, teléfono)
- Dirección de entrega
- Lista de productos con cantidades y precios
- Opciones personalizadas de cada producto
- Comentarios especiales
- Subtotal, delivery fee y total
- Método de pago
- Notas adicionales
  ✅ **Corte automático de papel**
  ✅ **Impresión de prueba**
  ✅ **Manejo de errores** robusto

---

## 🛠️ Hardware Compatible

### Impresoras Térmicas Recomendadas:

| Marca          | Modelo       | Ancho     | Conectividad          | Precio Aprox. |
| -------------- | ------------ | --------- | --------------------- | ------------- |
| EPSON          | TM-T20II/III | 58mm/80mm | Bluetooth/USB         | $150-250 USD  |
| Star Micronics | TSP143III    | 80mm      | Bluetooth             | $180-280 USD  |
| Bixolon        | SRP-275III   | 80mm      | Bluetooth             | $150-200 USD  |
| Sunmi          | V2 PRO       | 58mm      | Bluetooth (integrado) | $200-300 USD  |
| Generic        | ZJ-5890K     | 58mm      | Bluetooth             | $50-80 USD    |

**Nota:** Cualquier impresora térmica con soporte ESC/POS y Bluetooth debería funcionar.

---

## 📱 Configuración Inicial

### 1. **Emparejar Impresora con el Dispositivo Android**

Antes de usar la app, debes emparejar la impresora:

1. Enciende la impresora térmica
2. Activa el Bluetooth en tu dispositivo Android
3. Ve a **Configuración** → **Bluetooth**
4. Busca dispositivos disponibles
5. Selecciona tu impresora (ej: "BlueTooth Printer", "RPP02N", etc.)
6. Ingresa el PIN si es necesario (común: `0000` o `1234`)
7. ✅ Impresora emparejada exitosamente

### 2. **Conectar Impresora desde la App**

1. Abre la app **Delivery Go Fast**
2. Ve a **Gestión de Pedidos**
3. En el header, toca el ícono de **Bluetooth** (gris)
4. Selecciona tu impresora de la lista
5. Espera a que se conecte
6. ✅ El ícono de Bluetooth se pondrá **verde** cuando esté conectado

---

## 🖨️ Cómo Imprimir una Orden

### **Método 1: Desde la Lista de Órdenes**

1. Ve a **Gestión de Pedidos**
2. Encuentra la orden que deseas imprimir
3. Toca el botón **"Imprimir Orden"** (ícono de impresora)
4. Selecciona el tamaño de impresora:
   - **58mm** (ticketera pequeña)
   - **80mm** (ticketera grande)
5. Toca **"Imprimir"**
6. ✅ La orden se imprimirá automáticamente

### **Método 2: Impresión Automática al Aceptar**

Puedes configurar la app para que imprima automáticamente cuando aceptas una orden:

1. Acepta una orden pendiente
2. Toca **"Imprimir Orden"** inmediatamente después
3. ✅ Ticket impreso

---

## 📄 Ejemplo de Ticket Impreso

```
================================
     DELIVERY GO FAST
    www.gofastdelivery.site
    Tel: (123) 456-7890
================================
PEDIDO #A1B2C3D4
Fecha: 14/11/2025 18:30
================================
CLIENTE:
Juan Pérez
Tel: +51987654321
================================
DIRECCION:
Av. Principal 123, San Isidro,
Lima
================================
Tipo: Delivery
================================
PRODUCTOS:
================================
2x Hamburguesa Clásica.S/ 30.00
  + Extra queso (+S/ 2.00)
  + Sin cebolla
  Nota: Sin pepinillos

1x Papas Fritas..........S/ 8.00

1x Coca Cola 1L..........S/ 5.00
================================
Subtotal:              S/ 43.00
Delivery:               S/ 5.00
================================
TOTAL:                 S/ 48.00
================================
Pago: Efectivo
================================
NOTAS:
Tocar timbre dos veces
================================

   Gracias por su preferencia!
        Vuelva pronto


[Corte de papel]
```

---

## 🔧 Solución de Problemas

### ❌ **"No se encontraron impresoras"**

**Causa:** La impresora no está emparejada con el dispositivo.

**Solución:**

1. Ve a **Configuración Android** → **Bluetooth**
2. Empareja la impresora primero
3. Vuelve a la app y busca de nuevo

---

### ❌ **"No se pudo conectar a [nombre impresora]"**

**Causa:** La impresora está apagada, sin batería o fuera de rango.

**Solución:**

1. Verifica que la impresora esté encendida (luz LED)
2. Acércate más a la impresora (máximo 10 metros)
3. Carga la batería si es portátil
4. Reinicia la impresora
5. Intenta conectar nuevamente

---

### ❌ **"Error al imprimir" o imprime caracteres extraños**

**Causa:** Incompatibilidad con el formato ESC/POS o configuración incorrecta.

**Solución:**

1. Verifica que tu impresora soporte **ESC/POS** (la mayoría lo hacen)
2. Imprime un ticket de prueba desde el menú de la impresora
3. Consulta el manual de tu impresora
4. Algunos modelos chinos usan comandos ligeramente diferentes

---

### ❌ **Se imprime pero no corta el papel**

**Causa:** Tu impresora no soporta el comando de corte automático o requiere configuración.

**Solución:**

- Corta manualmente el papel
- O consulta el manual para habilitar corte automático

---

### ❌ **El Bluetooth se desconecta constantemente**

**Causa:** Ahorro de energía del dispositivo Android o baja batería de la impresora.

**Solución:**

1. Desactiva optimización de batería para la app:
   - **Configuración** → **Batería** → **Optimización de batería**
   - Busca "Delivery Go Fast"
   - Selecciona **"No optimizar"**
2. Carga la batería de la impresora

---

## 🎨 Personalización

### Cambiar Encabezado del Ticket

Edita el archivo: `thermal-printer.service.ts`

```typescript
// Línea ~320
ticket += this.CENTER;
ticket += this.BOLD_ON + this.DOUBLE_HEIGHT;
ticket += "TU RESTAURANTE\n"; // ← Cambia aquí
ticket += this.NORMAL + this.BOLD_OFF;
ticket += "www.turestaurante.com\n"; // ← Cambia aquí
ticket += "Tel: (01) 234-5678\n"; // ← Cambia aquí
```

### Cambiar Ancho de Línea

```typescript
// Para impresora de 58mm (32 caracteres)
private readonly LINE = '--------------------------------\n';

// Para impresora de 80mm (48 caracteres)
private readonly LINE_80 = '------------------------------------------------\n';
```

---

## 📊 Comandos ESC/POS Utilizados

| Comando    | Código         | Función               |
| ---------- | -------------- | --------------------- |
| `ESC @`    | `\x1B\x40`     | Inicializar impresora |
| `ESC a 0`  | `\x1B\x61\x00` | Alinear izquierda     |
| `ESC a 1`  | `\x1B\x61\x01` | Centrar texto         |
| `ESC a 2`  | `\x1B\x61\x02` | Alinear derecha       |
| `ESC E 1`  | `\x1B\x45\x01` | Negrita ON            |
| `ESC E 0`  | `\x1B\x45\x00` | Negrita OFF           |
| `ESC ! 16` | `\x1B\x21\x10` | Doble altura          |
| `ESC ! 0`  | `\x1B\x21\x00` | Tamaño normal         |
| `GS V 0`   | `\x1D\x56\x00` | Cortar papel          |

---

## 🚀 Funcionalidades Avanzadas (Futuras)

### Ideas para Mejorar:

- ✅ **Auto-impresión**: Imprimir automáticamente al recibir nuevo pedido
- ✅ **Múltiples copias**: Imprimir 2 copias (cocina + cliente)
- ✅ **Logo gráfico**: Imprimir logo del restaurante como imagen
- ✅ **Código QR**: Agregar QR para seguimiento de orden
- ✅ **Sonido de confirmación**: Beep al imprimir exitosamente
- ✅ **Historial de impresiones**: Registro de qué órdenes se imprimieron
- ✅ **Impresión por categoría**: Imprimir solo bebidas o comidas

---

## 📞 Soporte

Si tienes problemas con una impresora específica:

1. Verifica que sea compatible con ESC/POS
2. Busca el manual de tu modelo en Google
3. Algunos modelos chinos usan comandos propietarios
4. Contacta al proveedor de la impresora para comandos específicos

---

## ✅ Checklist de Implementación

- [x] Plugin Bluetooth instalado (`cordova-plugin-bluetooth-serial`)
- [x] Servicio de impresión térmica creado (`thermal-printer.service.ts`)
- [x] Botón de conexión en el header
- [x] Botón de impresión en cada orden
- [x] Formato ESC/POS implementado
- [x] Soporte para 58mm y 80mm
- [x] Manejo de errores
- [x] Mensajes de confirmación
- [x] Documentación completa

---

## 🎉 ¡Listo para Usar!

Tu sistema de impresión térmica está completamente configurado. Los restaurantes ahora pueden:

1. ✅ Conectarse a impresoras Bluetooth
2. ✅ Imprimir órdenes profesionales
3. ✅ Ver estado de conexión en tiempo real
4. ✅ Imprimir tickets de prueba
5. ✅ Soporte para impresoras de 58mm y 80mm

---

**Fecha de implementación:** 14 de noviembre de 2025
**Versión:** 1.0.0
**Estado:** ✅ Producción Ready
