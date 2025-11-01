import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { rolesGuard } from './guards/roles.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  { path: '', redirectTo: 'tabs', pathMatch: 'full' },
  // Restaurantes (público)
  {
    path: 'restaurant/:id',
    loadComponent: () =>
      import('./pages/restaurant-detail/restaurant-detail.page').then(
        (m) => m.RestaurantDetailPage
      ),
  },
  // Detalle de ítem de menú (público)
  {
    path: 'restaurants/:restaurantId/menu/:itemId',
    loadComponent: () =>
      import('./pages/menu-item-detail/menu-item-detail.page').then(
        (m) => m.MenuItemDetailPage
      ),
  },
  // Perfil
  {
    path: 'profile',
    canMatch: [authGuard],
    loadComponent: () =>
      import('./pages/profile/profile.page').then((m) => m.ProfilePage),
  },
  {
    path: 'auth/login',
    canMatch: [guestGuard],
    loadComponent: () =>
      import('./pages/auth/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'auth/register',
    canMatch: [guestGuard],
    loadComponent: () =>
      import('./pages/auth/register/register.page').then((m) => m.RegisterPage),
  },
  // Ejemplo de ruta protegida por rol (super_admin)
  {
    path: 'admin/users',
    canMatch: [authGuard, rolesGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./pages/admin/users/users.page').then((m) => m.AdminUsersPage),
  },
  // Admin Restaurantes
  {
    path: 'admin/restaurants',
    canMatch: [authGuard, rolesGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./pages/admin/restaurant-list/restaurant-list.page').then(
        (m) => m.AdminRestaurantListPage
      ),
  },
  {
    path: 'admin/restaurants/form',
    canMatch: [authGuard, rolesGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./pages/admin/restaurant-form/restaurant-form.page').then(
        (m) => m.AdminRestaurantFormPage
      ),
  },
  {
    path: 'admin/restaurants/categories',
    canMatch: [authGuard, rolesGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./pages/admin/restaurant-categories').then(
        (m) => m.AdminRestaurantCategoriesPage
      ),
  },
  {
    path: 'admin/restaurants/:id/menu-categories',
    canMatch: [authGuard, rolesGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./pages/admin/menu-categories').then(
        (m) => m.AdminMenuCategoriesPage
      ),
  },
  {
    path: 'admin/restaurants/:id/menu-items',
    canMatch: [authGuard, rolesGuard],
    data: { roles: ['super_admin'] },
    loadComponent: () =>
      import('./pages/admin/menu-items').then((m) => m.AdminMenuItemsPage),
  },
  {
    path: 'cart',
    canMatch: [authGuard],
    loadComponent: () =>
      import('./pages/cart/cart.page').then((m) => m.CartPage),
  },
  {
    path: 'order-history',
    canMatch: [authGuard],
    loadComponent: () =>
      import('./pages/order-history/order-history.page').then(
        (m) => m.OrderHistoryPage
      ),
  },
  {
    path: 'order-detail/:id',
    canMatch: [authGuard],
    loadComponent: () =>
      import('./pages/order-detail/order-detail.page').then(
        (m) => m.OrderDetailPage
      ),
  },
  // Módulo de Repartidores (Delivery Driver) - Con Tabs
  {
    path: 'delivery-driver',
    canMatch: [authGuard, rolesGuard],
    data: { roles: ['driver'] },
    loadComponent: () =>
      import('./pages/delivery-driver/driver-tabs/driver-tabs.page').then(
        (m) => m.DriverTabsPage
      ),
    children: [
      {
        path: 'available',
        loadComponent: () =>
          import(
            './pages/delivery-driver/available-deliveries/available-deliveries.page'
          ).then((m) => m.AvailableDeliveriesPage),
      },
      {
        path: 'my-deliveries',
        loadComponent: () =>
          import(
            './pages/delivery-driver/my-deliveries/my-deliveries.page'
          ).then((m) => m.MyDeliveriesPage),
      },
      {
        path: '',
        redirectTo: 'available',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'delivery-driver/delivery-detail/:id',
    canMatch: [authGuard, rolesGuard],
    data: { roles: ['driver'] },
    loadComponent: () =>
      import(
        './pages/delivery-driver/delivery-detail/active-delivery.page'
      ).then((m) => m.DeliveryDetailPage),
  },
  // Módulo de Restaurante (Restaurant Owner)
  {
    path: 'restaurant-orders',
    canMatch: [authGuard, rolesGuard],
    data: { roles: ['restaurant_owner'] },
    loadComponent: () =>
      import('./pages/restaurant-orders/restaurant-orders.page').then(
        (m) => m.RestaurantOrdersPage
      ),
  },
];
