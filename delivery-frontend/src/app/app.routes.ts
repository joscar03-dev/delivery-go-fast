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
];
