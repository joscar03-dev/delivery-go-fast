import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonThumbnail,
  IonNote,
  IonSpinner,
  IonAlert,
  IonToast,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { CartItem, CreateOrderDto } from '../../models/order.model';
import { addIcons } from 'ionicons';
import {
  removeOutline,
  addOutline,
  trashOutline,
  basketOutline,
} from 'ionicons/icons';

addIcons({
  'remove-outline': removeOutline,
  'add-outline': addOutline,
  'trash-outline': trashOutline,
  'basket-outline': basketOutline,
});

@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonThumbnail,
    IonNote,
    IonSpinner,
    IonAlert,
    IonToast,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    CommonModule,
    FormsModule,
  ],
})
export class CartPage implements OnInit {
  private cartService = inject(CartService);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private router = inject(Router);

  cartItems$ = this.cartService.cartItems$;
  loading = false;
  showAlert = false;
  showToast = false;
  toastMessage = '';
  alertMessage = '';

  ngOnInit() {}

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
  optionGroups(
    item: CartItem
  ): Array<{
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

    this.loading = true;

    try {
      // Preparar los datos del pedido
      const orderData: CreateOrderDto = {
        restaurantId: this.cartService.currentRestaurantId!,
        items: this.cartItems.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          comment: item.comment,
          options: item.options,
        })),
        notes: '', // Puedes agregar un campo para notas si lo deseas
        deliveryAddress: '', // Puedes obtener esto del perfil del usuario
      };

      // Crear el pedido
      const order = await this.orderService.createOrder(orderData).toPromise();

      // Limpiar el carrito
      this.cartService.clearCart();

      // Mostrar confirmación
      this.toastMessage = 'Pedido realizado exitosamente';
      this.showToast = true;

      // Redirigir al historial de pedidos después de un momento
      setTimeout(() => {
        this.router.navigate(['/order-history']);
      }, 2000);
    } catch (error: any) {
      console.error('Error creating order:', error);
      this.alertMessage =
        error.error?.message ||
        'Error al realizar el pedido. Inténtalo de nuevo.';
      this.showAlert = true;
    } finally {
      this.loading = false;
    }
  }

  onAlertDismiss(): void {
    this.showAlert = false;
  }

  onToastDismiss(): void {
    this.showToast = false;
  }
}
