import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import { authGuard } from '../guards/auth.guard';
import { rolesGuard } from '../guards/roles.guard';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'business',
        loadComponent: () =>
          import('../tab1/tab1.page').then((m) => m.Tab1Page),
      },
      {
        path: 'admin',
        canMatch: [authGuard, rolesGuard],
        data: { roles: ['super_admin'] },
        loadComponent: () =>
          import('../tab2/tab2.page').then((m) => m.Tab2Page),
      },
      {
        path: 'account',
        canMatch: [authGuard],
        loadComponent: () =>
          import('../pages/profile/profile.page').then((m) => m.ProfilePage),
      },
      // Carrito (dentro de tabs)
      {
        path: 'cart',
        canMatch: [authGuard],
        loadComponent: () =>
          import('../pages/cart/cart.page').then((m) => m.CartPage),
      },
      // Checkout (dentro de tabs)
      {
        path: 'checkout',
        canMatch: [authGuard],
        loadComponent: () =>
          import('../pages/checkout/checkout.page').then((m) => m.CheckoutPage),
      },
      // Historial de pedidos (dentro de tabs)
      {
        path: 'order-history',
        canMatch: [authGuard],
        loadComponent: () =>
          import('../pages/order-history/order-history.page').then(
            (m) => m.OrderHistoryPage
          ),
      },
      // Detalle de pedido (dentro de tabs)
      {
        path: 'order-detail/:id',
        canMatch: [authGuard],
        loadComponent: () =>
          import('../pages/order-detail/order-detail.page').then(
            (m) => m.OrderDetailPage
          ),
      },
      // Búsqueda (dentro de tabs)
      {
        path: 'search',
        loadComponent: () =>
          import('../pages/search/search.page').then((m) => m.SearchPage),
      },
      // Direcciones (dentro de tabs)
      {
        path: 'addresses',
        canMatch: [authGuard],
        loadComponent: () =>
          import('../pages/addresses/addresses.page').then(
            (m) => m.AddressesPage
          ),
      },
      // Panel de administración de restaurantes
      {
        path: 'restaurant-admin',
        canMatch: [authGuard, rolesGuard],
        data: { roles: ['restaurant_owner', 'super_admin'] },
        loadComponent: () =>
          import('../pages/restaurant-admin/restaurant-admin.page').then(
            (m) => m.RestaurantAdminPage
          ),
      },
      // Configuración de delivery
      {
        path: 'restaurant-admin/:id/delivery-config',
        canMatch: [authGuard, rolesGuard],
        data: { roles: ['restaurant_owner', 'super_admin'] },
        loadComponent: () =>
          import('../pages/delivery-config/delivery-config.page').then(
            (m) => m.DeliveryConfigPage
          ),
      },
      { path: '', redirectTo: 'business', pathMatch: 'full' },
    ],
  },
];
