import {
  Component,
  EnvironmentInjector,
  inject,
  computed,
  signal,
} from '@angular/core';
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonBadge,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { CommonModule } from '@angular/common';
import {
  triangle,
  ellipse,
  square,
  basketOutline,
  receiptOutline,
  bicycleOutline,
  restaurantOutline,
} from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { CartService } from '../services/cart.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [
    CommonModule,
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel,
    IonBadge,
  ],
})
export class TabsPage {
  public environmentInjector = inject(EnvironmentInjector);
  private auth = inject(AuthService);
  private cartService = inject(CartService);
  private router = inject(Router);

  isSuperAdmin = computed(() => this.auth.hasRole('super_admin'));
  isDeliveryDriver = computed(() => this.auth.hasRole('driver'));
  isRestaurantOwner = computed(() => this.auth.hasRole('restaurant_owner'));

  // Exponer los observables del carrito al template
  cartItems$ = this.cartService.cartItems$;
  cartItemCount = computed(() => this.cartService.itemCount);

  constructor() {
    addIcons({
      triangle,
      ellipse,
      square,
      'basket-outline': basketOutline,
      'receipt-outline': receiptOutline,
      'bicycle-outline': bicycleOutline,
      'restaurant-outline': restaurantOutline,
    });
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  goToOrderHistory(): void {
    // Verificar autenticación antes de navegar
    if (this.auth.ensureAuthenticated('/order-history')) {
      this.router.navigate(['/order-history']);
    }
  }

  goToDeliveries(): void {
    // Verificar autenticación antes de navegar
    if (this.auth.ensureAuthenticated('/delivery-driver/available')) {
      this.router.navigate(['/delivery-driver/available']);
    }
  }

  goToRestaurantOrders(): void {
    // Verificar autenticación antes de navegar
    if (this.auth.ensureAuthenticated('/restaurant-orders')) {
      this.router.navigate(['/restaurant-orders']);
    }
  }
}
