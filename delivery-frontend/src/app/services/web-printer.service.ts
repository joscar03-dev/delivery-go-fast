import { Injectable } from '@angular/core';

export interface OrderToPrint {
  id: string;
  orderNumber?: string;
  createdAt: Date | string;
  client?: {
    name?: string;
    phone?: string;
  };
  items: Array<{
    quantity: number;
    menuItem?: {
      name: string;
      price: number;
    };
    selectedOptions?: any[];
    comment?: string;
  }>;
  deliveryAddress?: string;
  deliveryType?: string;
  paymentMethod?: string;
  notes?: string;
  total: number;
  subtotal?: number;
  deliveryFee?: number;
}

@Injectable({
  providedIn: 'root',
})
export class WebPrinterService {
  constructor() {
    console.log('🖨️ WebPrinterService inicializado');
  }

  /**
   * Imprime una orden usando window.print() con formato HTML/CSS
   * Compatible con impresoras USB, de red, y térmicas conectadas por USB
   */
  printOrder(order: OrderToPrint, printerWidth: 58 | 80 = 80): void {
    // Crear una ventana temporal para imprimir
    const printWindow = window.open('', '_blank', 'width=800,height=600');

    if (!printWindow) {
      alert(
        '⚠️ Bloqueo de ventanas emergentes detectado. Por favor, permite ventanas emergentes para imprimir.'
      );
      return;
    }

    // Generar el HTML del ticket
    const ticketHTML = this.generateTicketHTML(order, printerWidth);

    // Escribir el HTML en la ventana
    printWindow.document.write(ticketHTML);
    printWindow.document.close();

    // Esperar a que se cargue y luego imprimir
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        // Cerrar la ventana después de imprimir (o cancelar)
        printWindow.onafterprint = () => {
          printWindow.close();
        };
      }, 250);
    };
  }

  /**
   * Genera el HTML formateado del ticket con CSS para impresión
   */
  private generateTicketHTML(order: OrderToPrint, width: 58 | 80): string {
    const widthMm = width; // 58mm o 80mm
    const fontSize = width === 58 ? '11px' : '12px';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Ticket - Pedido #${
    order.orderNumber || order.id.substring(0, 8)
  }</title>
  <style>
    /* Reset y configuración básica */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @page {
      size: ${widthMm}mm auto; /* Ancho del ticket, altura automática */
      margin: 0;
    }

    @media print {
      body {
        width: ${widthMm}mm;
      }
    }

    body {
      font-family: 'Courier New', monospace;
      font-size: ${fontSize};
      line-height: 1.4;
      color: #000;
      background: #fff;
      width: ${widthMm}mm;
      padding: 5mm;
    }

    /* Encabezado */
    .header {
      text-align: center;
      margin-bottom: 10px;
      border-bottom: 2px dashed #000;
      padding-bottom: 10px;
    }

    .restaurant-name {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .restaurant-info {
      font-size: 10px;
    }

    /* Información del pedido */
    .order-info {
      margin: 10px 0;
      border-bottom: 1px dashed #000;
      padding-bottom: 10px;
    }

    .order-number {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .order-date {
      font-size: 10px;
      color: #333;
    }

    /* Sección */
    .section {
      margin: 10px 0;
      border-bottom: 1px dashed #000;
      padding-bottom: 10px;
    }

    .section-title {
      font-weight: bold;
      margin-bottom: 5px;
      text-transform: uppercase;
    }

    .section-content {
      font-size: ${fontSize};
    }

    /* Items del pedido */
    .items {
      margin: 10px 0;
    }

    .item {
      margin-bottom: 8px;
    }

    .item-line {
      display: flex;
      justify-content: space-between;
      font-weight: bold;
    }

    .item-qty {
      min-width: 25px;
    }

    .item-name {
      flex: 1;
      margin: 0 5px;
    }

    .item-price {
      min-width: 60px;
      text-align: right;
    }

    .item-options {
      margin-left: 25px;
      font-size: 10px;
      color: #333;
    }

    .item-comment {
      margin-left: 25px;
      font-size: 10px;
      font-style: italic;
      color: #666;
    }

    /* Totales */
    .totals {
      margin: 10px 0;
      border-top: 2px solid #000;
      padding-top: 10px;
    }

    .total-line {
      display: flex;
      justify-content: space-between;
      margin: 3px 0;
    }

    .total-line.grand-total {
      font-size: 16px;
      font-weight: bold;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #000;
    }

    /* Footer */
    .footer {
      text-align: center;
      margin-top: 15px;
      font-size: 11px;
      border-top: 2px dashed #000;
      padding-top: 10px;
    }

    .thank-you {
      font-weight: bold;
      margin-bottom: 5px;
    }

    /* Utilidades */
    .line {
      border-bottom: 1px dashed #000;
      margin: 8px 0;
    }

    .text-center {
      text-align: center;
    }

    .text-right {
      text-align: right;
    }

    .bold {
      font-weight: bold;
    }

    /* Ocultar en pantalla, solo mostrar para impresión */
    @media screen {
      body {
        background: #f5f5f5;
        padding: 20px;
        max-width: ${widthMm}mm;
        margin: 20px auto;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
    }
  </style>
</head>
<body>
  <!-- ENCABEZADO -->
  <div class="header">
    <div class="restaurant-name">DELIVERY GO FAST</div>
    <div class="restaurant-info">www.gofastdelivery.site</div>
    <div class="restaurant-info">Tel: (123) 456-7890</div>
  </div>

  <!-- INFORMACIÓN DEL PEDIDO -->
  <div class="order-info">
    <div class="order-number">PEDIDO #${
      order.orderNumber || order.id.substring(0, 8).toUpperCase()
    }</div>
    <div class="order-date">Fecha: ${this.formatDate(order.createdAt)}</div>
  </div>

  ${
    order.client?.name
      ? `
  <!-- CLIENTE -->
  <div class="section">
    <div class="section-title">Cliente:</div>
    <div class="section-content">
      ${order.client.name}
      ${order.client.phone ? `<br>Tel: ${order.client.phone}` : ''}
    </div>
  </div>
  `
      : ''
  }

  ${
    order.deliveryAddress
      ? `
  <!-- DIRECCIÓN -->
  <div class="section">
    <div class="section-title">Dirección:</div>
    <div class="section-content">${order.deliveryAddress}</div>
    ${
      order.deliveryType
        ? `<div class="section-content">Tipo: ${order.deliveryType}</div>`
        : ''
    }
  </div>
  `
      : ''
  }

  <!-- PRODUCTOS -->
  <div class="section">
    <div class="section-title">Productos:</div>
    <div class="items">
      ${order.items
        .map(
          (item) => `
        <div class="item">
          <div class="item-line">
            <span class="item-qty">${item.quantity}x</span>
            <span class="item-name">${item.menuItem?.name || 'Producto'}</span>
            <span class="item-price">S/ ${(
              (item.menuItem?.price || 0) * item.quantity
            ).toFixed(2)}</span>
          </div>
          ${
            item.selectedOptions && item.selectedOptions.length > 0
              ? `
            <div class="item-options">
              ${item.selectedOptions
                .map(
                  (opt: any) =>
                    `+ ${opt.name || opt.optionName}${
                      opt.extraPrice && opt.extraPrice > 0
                        ? ` (+S/ ${opt.extraPrice.toFixed(2)})`
                        : ''
                    }`
                )
                .join('<br>')}
            </div>
          `
              : ''
          }
          ${
            item.comment
              ? `
            <div class="item-comment">Nota: ${item.comment}</div>
          `
              : ''
          }
        </div>
      `
        )
        .join('')}
    </div>
  </div>

  <!-- TOTALES -->
  <div class="totals">
    ${
      order.subtotal
        ? `
      <div class="total-line">
        <span>Subtotal:</span>
        <span>S/ ${order.subtotal.toFixed(2)}</span>
      </div>
    `
        : ''
    }
    ${
      order.deliveryFee && order.deliveryFee > 0
        ? `
      <div class="total-line">
        <span>Delivery:</span>
        <span>S/ ${order.deliveryFee.toFixed(2)}</span>
      </div>
    `
        : ''
    }
    <div class="total-line grand-total">
      <span>TOTAL:</span>
      <span>S/ ${order.total.toFixed(2)}</span>
    </div>
    ${
      order.paymentMethod
        ? `
      <div class="total-line">
        <span>Pago:</span>
        <span>${order.paymentMethod}</span>
      </div>
    `
        : ''
    }
  </div>

  ${
    order.notes
      ? `
  <!-- NOTAS -->
  <div class="section">
    <div class="section-title">Notas:</div>
    <div class="section-content">${order.notes}</div>
  </div>
  `
      : ''
  }

  <!-- FOOTER -->
  <div class="footer">
    <div class="thank-you">¡Gracias por su preferencia!</div>
    <div>Vuelva pronto</div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Formatea una fecha
   */
  private formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Imprime un ticket de prueba
   */
  printTestTicket(): void {
    const testOrder: OrderToPrint = {
      id: 'TEST123',
      orderNumber: 'TEST001',
      createdAt: new Date(),
      client: {
        name: 'Cliente de Prueba',
        phone: '+51987654321',
      },
      items: [
        {
          quantity: 2,
          menuItem: {
            name: 'Hamburguesa Clásica',
            price: 15.0,
          },
          selectedOptions: [
            { name: 'Extra queso', extraPrice: 2.0 },
            { name: 'Sin cebolla', extraPrice: 0 },
          ],
          comment: 'Sin pepinillos por favor',
        },
        {
          quantity: 1,
          menuItem: {
            name: 'Papas Fritas',
            price: 8.0,
          },
        },
      ],
      deliveryAddress: 'Av. Principal 123, San Isidro, Lima',
      deliveryType: 'Delivery',
      paymentMethod: 'Efectivo',
      notes: 'Tocar timbre dos veces',
      subtotal: 38.0,
      deliveryFee: 5.0,
      total: 43.0,
    };

    this.printOrder(testOrder, 80);
  }
}
