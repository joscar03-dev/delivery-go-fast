import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Guard de autenticación: requiere accessToken para permitir el match de la ruta
export const authGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.getAccessToken();
  if (token) return true;

  // Redirigir a login si no hay sesión, preservando destino
  const redirectUrl = router.url || '/tabs';
  return router.createUrlTree(['/auth/login'], {
    queryParams: { redirectUrl },
  });
};
