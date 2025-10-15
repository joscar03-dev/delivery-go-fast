import { inject } from '@angular/core';
import { CanMatchFn, Route, UrlSegment, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Guard de roles: lee data.roles en la ruta y valida con el rol del usuario actual
export const rolesGuard: CanMatchFn = (
  route: Route,
  _segments: UrlSegment[]
) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const expected = (route.data?.['roles'] ?? []) as string[];
  if (!expected.length) return true; // si no hay restricción, permitir

  const isAllowed = auth.hasRole(expected as any);
  if (isAllowed) return true;

  // Redirigir si no tiene permisos
  return router.createUrlTree(['/tabs']);
};
