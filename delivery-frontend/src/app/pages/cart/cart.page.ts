import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonIcon,
  IonSpinner,
  IonAlert,
  IonToast,
  ModalController,
  IonModal,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { AddressService } from '../../services/address.service';
import { CartItem, CreateOrderDto } from '../../models/order.model';
import { Address } from '../../models/address.model';
import { AddressSelectorComponent } from '../../components/address-selector/address-selector.component';
import { PenCurrencyPipe } from '../../pipes/pen-currency.pipe';
import { addIcons } from 'ionicons';
import {
  removeOutline,
  addOutline,
  trashOutline,
  basketOutline,
  locationOutline,
  arrowBack,
  location,
} from 'ionicons/icons';

addIcons({
  'remove-outline': removeOutline,
  'add-outline': addOutline,
  'trash-outline': trashOutline,
  'basket-outline': basketOutline,
  'location-outline': locationOutline,
  'arrow-back': arrowBack,
  location: location,
});

@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    IonSpinner,
    IonAlert,
    IonToast,
    IonModal,
    CommonModule,
    FormsModule,
    AddressSelectorComponent,
    PenCurrencyPipe,
  ],
})
export class CartPage implements OnInit {
  @ViewChild('addressModal') addressModal!: IonModal;

  private cartService = inject(CartService);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private addressService = inject(AddressService);
  private modalCtrl = inject(ModalController);
  public router = inject(Router);

  cartItems$ = this.cartService.cartItems$;
  loading = false;
  showAlert = false;
  showToast = false;
  toastMessage = '';
  alertMessage = '';
  selectedAddress: Address | null = null;

  async ngOnInit() {
    await this.loadDefaultAddress();
  }

  get cartItems(): CartItem[] {
    return this.cartService.cartItems;
  }

  get totalPrice(): number {
    return this.cartService.totalPrice;
  }

  get baseTotal(): number {
    return this.cartService.baseTotal;
  }

  get extrasTotal(): number {
    return this.cartService.extrasTotal;
  }

  get itemCount(): number {
    return this.cartService.itemCount;
  }

  unitTotal(item: CartItem): number {
    return this.cartService.getItemUnitTotal(item);
  }

  lineTotal(item: CartItem): number {
    return this.cartService.getItemLineTotal(item);
  }

  extrasUnit(item: CartItem): number {
    return this.cartService.getItemExtrasUnit(item);
  }

  // Normaliza las opciones para la vista del carrito
  optionGroups(item: CartItem): Array<{
    groupName: string;
    options: Array<{ name: string; extraPrice?: number }>;
  }> {
    const opts: any = item.options;
    if (opts && typeof opts === 'object' && Array.isArray(opts.groups)) {
      return opts.groups.map((g: any) => ({
        groupName: g.groupName || g.name || 'Opciones',
        options: Array.isArray(g.options)
          ? g.options.map((o: any) => ({
              name: o?.name ?? String(o?.id ?? ''),
              extraPrice: Number(o?.extraPrice) || 0,
            }))
          : [],
      }));
    }
    // Si es un array simple (legacy), no tenemos nombres; omite o muestra IDs
    if (Array.isArray(opts)) {
      return [
        {
          groupName: 'Opciones',
          options: opts.map((v: any) => ({ name: String(v), extraPrice: 0 })),
        },
      ];
    }
    return [];
  }

  updateQuantity(menuItemId: string, quantity: number): void {
    this.cartService.updateQuantity(menuItemId, quantity);
  }

  removeItem(menuItemId: string): void {
    this.cartService.removeItem(menuItemId);
    this.toastMessage = 'Producto eliminado del carrito';
    this.showToast = true;
  }

  clearCart(): void {
    this.cartService.clearCart();
    this.toastMessage = 'Carrito vaciado';
    this.showToast = true;
  }

  async createOrder(): Promise<void> {
    // Verificar autenticación
    if (!this.authService.ensureAuthenticated('/cart')) {
      return;
    }

    if (this.cartItems.length === 0) {
      this.alertMessage = 'El carrito está vacío';
      this.showAlert = true;
      return;
    }

    // Navegar a la página de checkout
    this.router.navigate(['/tabs/checkout']);
  }

  /**
   * Carga la dirección predeterminada del usuario
   */
  async loadDefaultAddress(): Promise<void> {
    try {
      const addresses = await this.addressService.getMyAddresses().toPromise();
      // Buscar la dirección predeterminada
      const defaultAddress = addresses?.find((addr: Address) => addr.isDefault);
      this.selectedAddress =
        defaultAddress || (addresses && addresses[0]) || null;
    } catch (error) {
      console.error('Error loading addresses:', error);
    }
  }

  /**
   * Abre el modal para seleccionar dirección usando el modal declarativo
   */
  async openAddressSelector(): Promise<void> {
    if (this.addressModal) {
      await this.addressModal.present();
    }
  }

  /**
   * Maneja la selección de dirección desde el modal
   */
  onAddressSelected(address: Address, modal: any): void {
    this.selectedAddress = address;
    modal.dismiss();
  }

  /**
   * Maneja la navegación a la página de direcciones desde el modal
   */
  async onNavigateToAddresses(modal: any): Promise<void> {
    console.log('🚀 Navigating to addresses from cart');
    await modal.dismiss();
    await this.router.navigate(['/tabs/addresses'], {
      state: { returnUrl: '/tabs/cart' },
    });
  }

  /**
   * Hook que se ejecuta cuando la vista está por entrar
   * Recarga la dirección predeterminada cuando regresamos de /addresses
   */
  async ionViewWillEnter(): Promise<void> {
    await this.loadDefaultAddress();
  }

  onAlertDismiss(): void {
    this.showAlert = false;
  }

  onToastDismiss(): void {
    this.showToast = false;
  }
}
