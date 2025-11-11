import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonRadioGroup,
  IonRadio,
  IonInput,
  IonTextarea,
  IonButton,
  IonSpinner,
  IonIcon,
  IonNote,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  locationOutline,
  walletOutline,
  cashOutline,
  cardOutline,
  receiptOutline,
  closeCircleOutline,
  bicycleOutline,
  rocketOutline,
} from 'ionicons/icons';

import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { PaymentService } from '../../services/payment.service';
import { AddressService } from '../../services/address.service';
import {
  PaymentMethodCode,
  PaymentMethod,
  RestaurantDeliveryConfig,
  CheckoutDto,
} from '../../models/payment.model';
import { CartItem } from '../../models/order.model';
import { Address } from '../../models/address.model';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.page.html',
  styleUrls: ['./checkout.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonRadioGroup,
    IonRadio,
    IonInput,
    IonTextarea,
    IonButton,
    IonSpinner,
    IonIcon,
    IonNote,
  ],
})
export class CheckoutPage implements OnInit {
  // Estado del carrito
  cartItems: CartItem[] = [];
  subtotal: number = 0;
  restaurantId: string = '';
  restaurantName: string = '';

  // Dirección
  userAddresses: Address[] = [];
  selectedAddressId: string = '';

  // Métodos de pago
  paymentMethods: PaymentMethod[] = [];
  selectedPaymentMethod: PaymentMethodCode = PaymentMethodCode.CASH;
  PaymentMethodCode = PaymentMethodCode; // Para usar en el template

  // Campos de pago
  cashAmount: number | undefined;
  transactionReference: string = '';
  paymentProofUrl: string = '';
  notes: string = '';

  // Configuración de delivery
  deliveryConfig: RestaurantDeliveryConfig | null = null;
  deliveryFee: number = 0;
  deliveryType: 'none' | 'restaurant' | 'platform' = 'platform'; // Tipo de delivery del restaurante

  // Totales
  total: number = 0;
  changeAmount: number = 0;

  // Estado de carga
  isLoading: boolean = false;
  isCalculatingDelivery: boolean = false;

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private paymentService: PaymentService,
    private addressService: AddressService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({
      locationOutline,
      walletOutline,
      cashOutline,
      cardOutline,
      receiptOutline,
      closeCircleOutline,
      bicycleOutline,
      rocketOutline,
    });
  }

  ngOnInit() {
    // Inicializar total
    this.calculateTotal();
    this.loadCheckoutData();
  }

  async loadCheckoutData() {
    this.isLoading = true;
    try {
      // Cargar items del carrito
      this.cartItems = this.cartService.cartItems;

      if (this.cartItems.length === 0) {
        await this.showToast('El carrito está vacío', 'warning');
        this.router.navigate(['/tabs/home']);
        return;
      }

      // Obtener información del restaurante del primer item
      this.restaurantId = this.cartItems[0].restaurantId;
      this.restaurantName = this.cartItems[0].restaurantName;

      // Calcular subtotal - asegurar que sea número
      this.subtotal = Number(this.cartService.totalPrice) || 0;

      // Cargar direcciones del usuario
      await this.loadUserAddresses();

      // Cargar métodos de pago disponibles
      await this.loadPaymentMethods();

      // Cargar configuración de delivery del restaurante
      await this.loadDeliveryConfig();
    } catch (error) {
      console.error('Error al cargar datos del checkout:', error);
      await this.showToast('Error al cargar información', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async loadUserAddresses() {
    try {
      this.userAddresses =
        (await this.addressService.getMyAddresses().toPromise()) || [];

      // Seleccionar la dirección por defecto o la primera
      const defaultAddress = this.userAddresses.find((addr) => addr.isDefault);
      if (defaultAddress) {
        this.selectedAddressId = defaultAddress.id;
      } else if (this.userAddresses.length > 0) {
        this.selectedAddressId = this.userAddresses[0].id;
      }
    } catch (error) {
      console.error('Error al cargar direcciones:', error);
    }
  }

  async loadPaymentMethods() {
    try {
      this.paymentMethods =
        (await this.paymentService.getAvailablePaymentMethods().toPromise()) ||
        [];
    } catch (error) {
      console.error('Error al cargar métodos de pago:', error);
      await this.showToast('Error al cargar métodos de pago', 'danger');
    }
  }

  async loadDeliveryConfig() {
    if (!this.restaurantId) return;

    this.isCalculatingDelivery = true;
    try {
      this.deliveryConfig =
        (await this.paymentService
          .getRestaurantDeliveryConfig(this.restaurantId)
          .toPromise()) || null;

      // Detectar tipo de delivery
      if (this.deliveryConfig) {
        this.deliveryType = this.deliveryConfig.deliveryType || 'platform';

        // Solo calcular tarifa si NO es tipo 'none'
        if (this.deliveryType === 'none') {
          this.deliveryFee = 0;
        } else {
          // Si el subtotal supera el umbral de delivery gratis
          if (
            this.deliveryConfig.freeDeliveryThreshold &&
            this.subtotal >= this.deliveryConfig.freeDeliveryThreshold
          ) {
            this.deliveryFee = 0;
          } else {
            this.deliveryFee = Number(this.deliveryConfig.deliveryFee) || 0;
          }
        }
      }

      this.calculateTotal();
    } catch (error) {
      console.error('Error al cargar configuración de delivery:', error);
      await this.showToast('Error al calcular tarifa de delivery', 'danger');
    } finally {
      this.isCalculatingDelivery = false;
    }
  }

  onPaymentMethodChange(methodCode: PaymentMethodCode) {
    this.selectedPaymentMethod = methodCode;

    // Limpiar campos específicos al cambiar de método
    this.cashAmount = undefined;
    this.transactionReference = '';
    this.paymentProofUrl = '';
    this.changeAmount = 0;
  }

  onCashAmountChange() {
    if (this.cashAmount && this.total > 0) {
      this.changeAmount = this.paymentService.calculateChange(
        this.cashAmount,
        this.total
      );
    } else {
      this.changeAmount = 0;
    }
  }

  calculateTotal() {
    // Asegurar que sean números
    const subtotal = Number(this.subtotal) || 0;
    const deliveryFee = Number(this.deliveryFee) || 0;
    this.total = subtotal + deliveryFee;
  }

  // Métodos auxiliares para formateo seguro
  getFormattedSubtotal(): string {
    return (Number(this.subtotal) || 0).toFixed(2);
  }

  getFormattedDeliveryFee(): string {
    return (Number(this.deliveryFee) || 0).toFixed(2);
  }

  getFormattedTotal(): string {
    return (Number(this.total) || 0).toFixed(2);
  }

  getFormattedDeliveryConfigFee(): string {
    return (Number(this.deliveryConfig?.deliveryFee) || 0).toFixed(2);
  }

  getFormattedChangeAmount(): string {
    return (Number(this.changeAmount) || 0).toFixed(2);
  }

  getFormattedItemTotal(item: CartItem): string {
    return (Number(item.price) * Number(item.quantity) || 0).toFixed(2);
  }

  getFormattedRemainingAmount(): string {
    const remaining =
      (Number(this.total) || 0) - (Number(this.cashAmount) || 0);
    return (remaining > 0 ? remaining : 0).toFixed(2);
  }

  async confirmOrder() {
    // Validaciones
    if (!this.selectedAddressId) {
      await this.showToast(
        'Por favor selecciona una dirección de entrega',
        'warning'
      );
      return;
    }

    if (!this.selectedPaymentMethod) {
      await this.showToast('Por favor selecciona un método de pago', 'warning');
      return;
    }

    // Validación específica para efectivo
    if (this.selectedPaymentMethod === PaymentMethodCode.CASH) {
      const validation = this.paymentService.validateCashPayment(
        this.cashAmount || 0,
        this.total
      );
      if (!validation.isValid) {
        await this.showToast(validation.message, 'warning');
        return;
      }
    }

    // Validación para Yape/Plin
    if (
      (this.selectedPaymentMethod === PaymentMethodCode.YAPE ||
        this.selectedPaymentMethod === PaymentMethodCode.PLIN) &&
      !this.transactionReference
    ) {
      await this.showToast(
        'Por favor ingresa el número de operación',
        'warning'
      );
      return;
    }

    // Confirmación del usuario
    const alert = await this.alertController.create({
      header: 'Confirmar pedido',
      message: `¿Confirmas tu pedido por S/ ${this.total.toFixed(2)}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Confirmar',
          handler: () => {
            this.processCheckout();
          },
        },
      ],
    });

    await alert.present();
  }

  async processCheckout() {
    this.isLoading = true;

    try {
      // Construir el DTO de checkout
      const checkoutDto: any = {
        // Usamos 'any' temporalmente para que coincida con el backend
        restaurantId: this.restaurantId,
        deliveryAddressId: this.selectedAddressId,
        items: this.cartItems.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          // Enviar las opciones completas (no solo los IDs)
          options: item.options || undefined,
          // El backend espera 'comment' no 'specialInstructions'
          comment: item.comment || undefined,
        })),
        paymentMethodCode: this.selectedPaymentMethod,
        notes: this.notes || undefined,
      };

      // Agregar campos específicos según el método de pago
      if (this.selectedPaymentMethod === PaymentMethodCode.CASH) {
        checkoutDto.cashAmount = this.cashAmount;
      } else if (
        this.selectedPaymentMethod === PaymentMethodCode.YAPE ||
        this.selectedPaymentMethod === PaymentMethodCode.PLIN
      ) {
        checkoutDto.transactionReference = this.transactionReference;
        checkoutDto.paymentProofUrl = this.paymentProofUrl || undefined;
      }

      // Realizar el checkout
      const order = await this.orderService.checkout(checkoutDto).toPromise();

      // Limpiar el carrito
      this.cartService.clearCart();

      // Mostrar mensaje de éxito
      await this.showToast('¡Pedido realizado con éxito!', 'success');

      // Navegar a la página de detalles del pedido o historial
      this.router.navigate(['/tabs/order-detail', order!.id]);
    } catch (error: any) {
      console.error('Error al procesar el checkout:', error);
      const message = error.error?.message || 'Error al procesar el pedido';
      await this.showToast(message, 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Extrae los IDs de las opciones seleccionadas del item del carrito
   */
  private extractSelectedOptions(
    options?: Record<string, any> | string[]
  ): string[] | undefined {
    if (!options) return undefined;

    // Si es un array de strings, asumimos que ya son los IDs
    if (Array.isArray(options)) {
      return options;
    }

    // Si es un objeto con estructura de grupos, extraer los IDs
    const selectedIds: string[] = [];
    if (
      typeof options === 'object' &&
      'groups' in options &&
      Array.isArray(options['groups'])
    ) {
      for (const group of options['groups']) {
        if (group && Array.isArray(group.options)) {
          for (const opt of group.options) {
            if (opt && opt.id) {
              selectedIds.push(opt.id);
            }
          }
        }
      }
    }

    return selectedIds.length > 0 ? selectedIds : undefined;
  }

  getSelectedAddress(): Address | undefined {
    return this.userAddresses.find(
      (addr) => addr.id === this.selectedAddressId
    );
  }

  getPaymentMethodIcon(code: PaymentMethodCode): string {
    switch (code) {
      case PaymentMethodCode.CASH:
        return 'cash-outline';
      case PaymentMethodCode.CARD:
        return 'card-outline';
      case PaymentMethodCode.YAPE:
      case PaymentMethodCode.PLIN:
        return 'wallet-outline';
      default:
        return 'wallet-outline';
    }
  }

  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top',
    });
    await toast.present();
  }

  // 🆕 Métodos helper para tipos de delivery

  /**
   * Indica si el restaurante permite seleccionar delivery
   */
  canSelectDelivery(): boolean {
    return this.deliveryType !== 'none';
  }

  /**
   * Indica si se debe mostrar la sección de dirección
   */
  shouldShowAddressSection(): boolean {
    // Solo mostrar dirección si el delivery está habilitado
    return this.deliveryType !== 'none';
  }

  /**
   * Obtiene el mensaje informativo según el tipo de delivery
   */
  getDeliveryTypeMessage(): string {
    switch (this.deliveryType) {
      case 'none':
        return '🏪 Este restaurante solo acepta pedidos para recoger en tienda.';
      case 'restaurant':
        return '🚴 Este restaurante gestiona su propio servicio de delivery.';
      case 'platform':
        return '🚀 Delivery gestionado por Go Fast con seguimiento en tiempo real.';
      default:
        return '';
    }
  }

  /**
   * Indica si se debe mostrar la tarifa de delivery
   */
  shouldShowDeliveryFee(): boolean {
    return this.deliveryType !== 'none';
  }

  /**
   * Obtiene el ícono según el tipo de delivery
   */
  getDeliveryTypeIcon(): string {
    switch (this.deliveryType) {
      case 'none':
        return 'close-circle-outline';
      case 'restaurant':
        return 'bicycle-outline';
      case 'platform':
        return 'rocket-outline';
      default:
        return 'location-outline';
    }
  }

  goToAddAddress() {
    this.router.navigate(['/tabs/addresses'], {
      queryParams: { returnUrl: '/tabs/checkout' },
    });
  }
}
