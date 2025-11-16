import { Injectable } from '@angular/core';
import { Platform, AlertController, LoadingController } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';

declare var bluetoothSerial: any;
declare var cordova: any;

export interface PrinterDevice {
  name: string;
  address: string;
  id: string;
}

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
export class ThermalPrinterService {
  private connectedPrinter: PrinterDevice | null = null;
  private isConnected: boolean = false;

  // Comandos ESC/POS (Estándar para impresoras térmicas)
  private readonly ESC = '\x1B';
  private readonly GS = '\x1D';

  // Comandos de formato
  private readonly INIT = this.ESC + '@'; // Inicializar impresora
  private readonly CENTER = this.ESC + 'a' + '\x01'; // Centrar texto
  private readonly LEFT = this.ESC + 'a' + '\x00'; // Alinear izquierda
  private readonly RIGHT = this.ESC + 'a' + '\x02'; // Alinear derecha
  private readonly BOLD_ON = this.ESC + 'E' + '\x01'; // Negrita ON
  private readonly BOLD_OFF = this.ESC + 'E' + '\x00'; // Negrita OFF
  private readonly DOUBLE_HEIGHT = this.ESC + '!' + '\x10'; // Doble altura
  private readonly NORMAL = this.ESC + '!' + '\x00'; // Tamaño normal
  private readonly CUT = this.GS + 'V' + '\x00'; // Cortar papel
  private readonly LINE = '--------------------------------\n'; // Línea separadora (32 caracteres para 58mm)
  private readonly LINE_80 =
    '------------------------------------------------\n'; // Para 80mm

  constructor(
    private platform: Platform,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {
    console.log('🖨️ ThermalPrinterService inicializado');
  }

  /**
   * Verifica si Bluetooth está disponible y habilitado
   */
  async isBluetoothEnabled(): Promise<boolean> {
    if (!this.platform.is('capacitor')) {
      console.warn('⚠️ Bluetooth no disponible en web');
      return false;
    }

    return new Promise((resolve) => {
      bluetoothSerial.isEnabled(
        () => {
          console.log('✅ Bluetooth habilitado');
          resolve(true);
        },
        () => {
          console.log('❌ Bluetooth deshabilitado');
          resolve(false);
        }
      );
    });
  }

  /**
   * Solicita habilitar Bluetooth
   */
  async requestEnableBluetooth(): Promise<boolean> {
    return new Promise((resolve) => {
      bluetoothSerial.enable(
        () => {
          console.log('✅ Bluetooth habilitado');
          resolve(true);
        },
        () => {
          console.log('❌ Usuario canceló habilitar Bluetooth');
          resolve(false);
        }
      );
    });
  }

  /**
   * Solicita permisos de Bluetooth (necesario para Android 12+)
   */
  async requestBluetoothPermissions(): Promise<boolean> {
    if (!this.platform.is('android')) {
      return true; // iOS no necesita estos permisos
    }

    // Para Android 12+ (API 31+), necesitamos permisos específicos
    if (
      typeof cordova !== 'undefined' &&
      cordova.plugins &&
      cordova.plugins.permissions
    ) {
      const permissions = cordova.plugins.permissions;

      // Lista de permisos necesarios
      const permissionsToRequest = [
        permissions.BLUETOOTH_CONNECT,
        permissions.BLUETOOTH_SCAN,
      ];

      return new Promise((resolve) => {
        // Verificar si ya tenemos los permisos
        permissions.checkPermission(
          permissions.BLUETOOTH_CONNECT,
          (status: any) => {
            if (status.hasPermission) {
              console.log('✅ Permisos de Bluetooth ya otorgados');
              resolve(true);
            } else {
              // Solicitar permisos
              console.log('📝 Solicitando permisos de Bluetooth...');
              permissions.requestPermissions(
                permissionsToRequest,
                (result: any) => {
                  const granted = result.hasPermission;
                  if (granted) {
                    console.log('✅ Permisos de Bluetooth otorgados');
                    resolve(true);
                  } else {
                    console.log('❌ Permisos de Bluetooth denegados');
                    resolve(false);
                  }
                },
                (error: any) => {
                  console.error('❌ Error solicitando permisos:', error);
                  resolve(false);
                }
              );
            }
          },
          (error: any) => {
            console.error('❌ Error verificando permisos:', error);
            // Si hay error, intentar de todas formas (dispositivos antiguos)
            resolve(true);
          }
        );
      });
    }

    // Si no está disponible el plugin de permisos, asumir que está bien
    console.log('⚠️ Plugin de permisos no disponible, continuando...');
    return true;
  }

  /**
   * Busca impresoras Bluetooth disponibles
   */
  async searchPrinters(): Promise<PrinterDevice[]> {
    const loading = await this.loadingController.create({
      message: 'Buscando impresoras...',
      duration: 10000,
    });
    await loading.present();

    try {
      // 1. Solicitar permisos de Bluetooth (Android 12+)
      const permissionsGranted = await this.requestBluetoothPermissions();
      if (!permissionsGranted) {
        await loading.dismiss();

        const alert = await this.alertController.create({
          header: '⚠️ Permisos requeridos',
          message:
            'La app necesita permisos de Bluetooth para conectarse a la impresora. Por favor, ve a Configuración y otorga los permisos.',
          buttons: ['OK'],
        });
        await alert.present();

        throw new Error('Permisos de Bluetooth denegados');
      }

      // 2. Verificar si Bluetooth está habilitado
      const enabled = await this.isBluetoothEnabled();
      if (!enabled) {
        const shouldEnable = await this.requestEnableBluetooth();
        if (!shouldEnable) {
          await loading.dismiss();
          throw new Error('Bluetooth no está habilitado');
        }
      }

      // 3. Buscar dispositivos emparejados
      const devices = await this.listPairedDevices();
      await loading.dismiss();

      console.log('🖨️ Impresoras encontradas:', devices);
      return devices;
    } catch (error) {
      await loading.dismiss();
      console.error('❌ Error buscando impresoras:', error);
      throw error;
    }
  }

  /**
   * Lista dispositivos Bluetooth emparejados
   */
  private listPairedDevices(): Promise<PrinterDevice[]> {
    return new Promise((resolve, reject) => {
      bluetoothSerial.list(
        (devices: any[]) => {
          const printers = devices.map((device) => ({
            name: device.name || 'Dispositivo sin nombre',
            address: device.address || device.id,
            id: device.id || device.address,
          }));
          resolve(printers);
        },
        (error: any) => {
          reject(error);
        }
      );
    });
  }

  /**
   * Conecta con una impresora específica
   */
  async connectToPrinter(printer: PrinterDevice): Promise<boolean> {
    console.log('🔌 Conectando a impresora:', printer.name);

    const loading = await this.loadingController.create({
      message: 'Conectando a impresora...',
      duration: 10000,
    });
    await loading.present();

    try {
      const connected = await this.connect(printer.address);
      await loading.dismiss();

      if (connected) {
        this.connectedPrinter = printer;
        this.isConnected = true;

        // Mostrar alerta de éxito
        const alert = await this.alertController.create({
          header: '✅ Conectado',
          message: `Conectado a ${printer.name}`,
          buttons: ['OK'],
        });
        await alert.present();

        console.log('✅ Conectado a impresora:', printer.name);
        return true;
      } else {
        throw new Error('No se pudo conectar');
      }
    } catch (error) {
      await loading.dismiss();
      console.error('❌ Error conectando:', error);

      const alert = await this.alertController.create({
        header: '❌ Error',
        message: `No se pudo conectar a ${printer.name}`,
        buttons: ['OK'],
      });
      await alert.present();

      return false;
    }
  }

  /**
   * Conecta por dirección MAC
   */
  private connect(address: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      bluetoothSerial.connect(
        address,
        () => {
          console.log('✅ Conexión Bluetooth exitosa');
          resolve(true);
        },
        (error: any) => {
          console.error('❌ Error de conexión Bluetooth:', error);
          reject(error);
        }
      );
    });
  }

  /**
   * Desconecta de la impresora
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    return new Promise((resolve) => {
      bluetoothSerial.disconnect(
        () => {
          console.log('✅ Desconectado de impresora');
          this.isConnected = false;
          this.connectedPrinter = null;
          resolve();
        },
        () => {
          console.log(
            '⚠️ Error al desconectar (quizás ya estaba desconectado)'
          );
          this.isConnected = false;
          this.connectedPrinter = null;
          resolve();
        }
      );
    });
  }

  /**
   * Imprime una orden
   */
  async printOrder(
    order: OrderToPrint,
    printerWidth: 58 | 80 = 58
  ): Promise<boolean> {
    if (!this.isConnected || !this.connectedPrinter) {
      const alert = await this.alertController.create({
        header: '⚠️ Sin conexión',
        message: 'Primero debes conectarte a una impresora',
        buttons: ['OK'],
      });
      await alert.present();
      return false;
    }

    const loading = await this.loadingController.create({
      message: 'Imprimiendo...',
      duration: 5000,
    });
    await loading.present();

    try {
      const ticket = this.generateTicket(order, printerWidth);
      await this.print(ticket);
      await loading.dismiss();

      console.log('✅ Orden impresa exitosamente');
      return true;
    } catch (error) {
      await loading.dismiss();
      console.error('❌ Error imprimiendo:', error);

      const alert = await this.alertController.create({
        header: '❌ Error',
        message: 'No se pudo imprimir la orden',
        buttons: ['OK'],
      });
      await alert.present();

      return false;
    }
  }

  /**
   * Genera el ticket de impresión en formato ESC/POS
   */
  private generateTicket(order: OrderToPrint, width: 58 | 80): string {
    const LINE = width === 58 ? this.LINE : this.LINE_80;
    const maxChars = width === 58 ? 32 : 48;

    let ticket = '';

    // Inicializar impresora
    ticket += this.INIT;

    // Logo/Encabezado centrado
    ticket += this.CENTER;
    ticket += this.BOLD_ON + this.DOUBLE_HEIGHT;
    ticket += 'DELIVERY GO FAST\n';
    ticket += this.NORMAL + this.BOLD_OFF;
    ticket += 'www.gofastdelivery.site\n';
    ticket += 'Tel: (123) 456-7890\n';
    ticket += LINE;

    // Número de orden
    ticket += this.LEFT;
    ticket += this.BOLD_ON;
    ticket += `PEDIDO #${order.orderNumber || order.id.substring(0, 8)}\n`;
    ticket += this.BOLD_OFF;
    ticket += `Fecha: ${this.formatDate(order.createdAt)}\n`;
    ticket += LINE;

    // Información del cliente
    if (order.client?.name) {
      ticket += this.BOLD_ON + 'CLIENTE:\n' + this.BOLD_OFF;
      ticket += `${order.client.name}\n`;
      if (order.client.phone) {
        ticket += `Tel: ${order.client.phone}\n`;
      }
      ticket += LINE;
    }

    // Dirección de entrega
    if (order.deliveryAddress) {
      ticket += this.BOLD_ON + 'DIRECCION:\n' + this.BOLD_OFF;
      ticket += this.wrapText(order.deliveryAddress, maxChars);
      ticket += LINE;
    }

    // Tipo de entrega
    if (order.deliveryType) {
      ticket += `Tipo: ${order.deliveryType}\n`;
    }

    // Items del pedido
    ticket += this.BOLD_ON + 'PRODUCTOS:\n' + this.BOLD_OFF;
    ticket += LINE;

    order.items.forEach((item) => {
      const itemName = item.menuItem?.name || 'Producto';
      const itemPrice = item.menuItem?.price || 0;
      const quantity = item.quantity;
      const total = itemPrice * quantity;

      // Línea del producto: "2x Producto................S/ 20.00"
      const productLine = `${quantity}x ${itemName}`;
      const priceStr = `S/ ${total.toFixed(2)}`;
      const spacesNeeded = maxChars - productLine.length - priceStr.length;
      const dots = '.'.repeat(Math.max(spacesNeeded, 1));

      ticket += `${productLine}${dots}${priceStr}\n`;

      // Opciones seleccionadas
      if (item.selectedOptions && item.selectedOptions.length > 0) {
        item.selectedOptions.forEach((opt: any) => {
          ticket += `  + ${opt.name || opt.optionName || 'Opción'}`;
          if (opt.extraPrice && opt.extraPrice > 0) {
            ticket += ` (+S/ ${opt.extraPrice.toFixed(2)})`;
          }
          ticket += '\n';
        });
      }

      // Comentario del item
      if (item.comment) {
        ticket += `  Nota: ${this.wrapText(
          item.comment,
          maxChars - 8,
          '        '
        )}\n`;
      }
    });

    ticket += LINE;

    // Totales
    if (order.subtotal) {
      const subtotalLine = 'Subtotal:';
      const subtotalPrice = `S/ ${order.subtotal.toFixed(2)}`;
      const spacesNeeded =
        maxChars - subtotalLine.length - subtotalPrice.length;
      ticket += `${subtotalLine}${' '.repeat(spacesNeeded)}${subtotalPrice}\n`;
    }

    if (order.deliveryFee && order.deliveryFee > 0) {
      const deliveryLine = 'Delivery:';
      const deliveryPrice = `S/ ${order.deliveryFee.toFixed(2)}`;
      const spacesNeeded =
        maxChars - deliveryLine.length - deliveryPrice.length;
      ticket += `${deliveryLine}${' '.repeat(spacesNeeded)}${deliveryPrice}\n`;
    }

    // Total final (más grande)
    ticket += LINE;
    ticket += this.BOLD_ON + this.DOUBLE_HEIGHT;
    const totalLine = 'TOTAL:';
    const totalPrice = `S/ ${order.total.toFixed(2)}`;
    const spacesNeeded =
      Math.floor(maxChars / 2) - totalLine.length - totalPrice.length;
    ticket += `${totalLine}${' '.repeat(
      Math.max(spacesNeeded, 1)
    )}${totalPrice}\n`;
    ticket += this.NORMAL + this.BOLD_OFF;
    ticket += LINE;

    // Método de pago
    if (order.paymentMethod) {
      ticket += `Pago: ${order.paymentMethod}\n`;
    }

    // Notas adicionales
    if (order.notes) {
      ticket += LINE;
      ticket += this.BOLD_ON + 'NOTAS:\n' + this.BOLD_OFF;
      ticket += this.wrapText(order.notes, maxChars);
      ticket += LINE;
    }

    // Pie de página
    ticket += '\n';
    ticket += this.CENTER;
    ticket += 'Gracias por su preferencia!\n';
    ticket += 'Vuelva pronto\n\n';

    // Cortar papel
    ticket += '\n\n\n';
    ticket += this.CUT;

    return ticket;
  }

  /**
   * Envía datos a la impresora
   */
  private print(data: string): Promise<void> {
    return new Promise((resolve, reject) => {
      bluetoothSerial.write(
        data,
        () => {
          console.log('✅ Datos enviados a impresora');
          resolve();
        },
        (error: any) => {
          console.error('❌ Error enviando datos:', error);
          reject(error);
        }
      );
    });
  }

  /**
   * Imprime un ticket de prueba
   */
  async printTest(): Promise<boolean> {
    if (!this.isConnected) {
      const alert = await this.alertController.create({
        header: '⚠️ Sin conexión',
        message: 'Primero debes conectarte a una impresora',
        buttons: ['OK'],
      });
      await alert.present();
      return false;
    }

    try {
      let ticket = this.INIT;
      ticket += this.CENTER;
      ticket += this.BOLD_ON + this.DOUBLE_HEIGHT;
      ticket += 'PRUEBA DE IMPRESION\n';
      ticket += this.NORMAL + this.BOLD_OFF;
      ticket += this.LINE;
      ticket += this.LEFT;
      ticket += 'Esta es una impresion de prueba\n';
      ticket += `Fecha: ${new Date().toLocaleString()}\n`;
      ticket += this.LINE;
      ticket += this.CENTER;
      ticket += 'Impresora funcionando correctamente!\n\n\n';
      ticket += this.CUT;

      await this.print(ticket);
      console.log('✅ Ticket de prueba impreso');
      return true;
    } catch (error) {
      console.error('❌ Error imprimiendo prueba:', error);
      return false;
    }
  }

  /**
   * Obtiene información de la impresora conectada
   */
  getConnectedPrinter(): PrinterDevice | null {
    return this.connectedPrinter;
  }

  /**
   * Verifica si hay una impresora conectada
   */
  isPrinterConnected(): boolean {
    return this.isConnected;
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
   * Envuelve texto largo en múltiples líneas
   */
  private wrapText(
    text: string,
    maxLength: number,
    indent: string = ''
  ): string {
    const words = text.split(' ');
    let lines: string[] = [];
    let currentLine = '';

    words.forEach((word) => {
      if ((currentLine + word).length <= maxLength) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return (
      lines.map((line, index) => (index > 0 ? indent : '') + line).join('\n') +
      '\n'
    );
  }
}
