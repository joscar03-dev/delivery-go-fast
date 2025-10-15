import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Si ya hay sesión, no permite entrar a rutas de invitado (login/register)
export const guestGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.getAccessToken()) {
    return router.createUrlTree(['/tabs']);
  }
  return true;
};
