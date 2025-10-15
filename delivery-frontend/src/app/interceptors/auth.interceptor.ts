import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import {
  ReplaySubject,
  catchError,
  filter,
  switchMap,
  take,
  throwError,
} from 'rxjs';

// Estado simple para coordinar refresh en paralelo
let isRefreshing = false;
const refreshSubject = new ReplaySubject<string>(1);

// Interceptor funcional (Angular 16+) para adjuntar el access token y manejar 401 con refresh
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getAccessToken();

  const isAuthEndpoint = (url: string) =>
    /\/auth\/(login|register|refresh)(\?|$|\/)/.test(url);

  // Evitar sobreescribir si ya viene un Authorization explícito o si es endpoint auth
  const needsAuthHeader =
    token && !req.headers.has('Authorization') && !isAuthEndpoint(req.url);

  const authReq = needsAuthHeader
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // Intentar refresh solo ante 401 y cuando no es endpoint de auth
      if (err.status === 401 && !isAuthEndpoint(req.url)) {
        const refreshToken = auth.getRefreshToken();
        if (!refreshToken) {
          auth.logout();
          return throwError(() => err);
        }

        if (!isRefreshing) {
          isRefreshing = true;
          // Disparar refresh y retransmitir nuevo token a la cola
          return auth.refresh().pipe(
            switchMap((newToken) => {
              isRefreshing = false;
              refreshSubject.next(newToken);
              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` },
              });
              return next(retryReq);
            }),
            catchError((refreshErr) => {
              isRefreshing = false;
              auth.logout();
              return throwError(() => refreshErr);
            })
          );
        } else {
          // Si ya hay refresh en curso, esperar al nuevo token y reintentar
          return refreshSubject.pipe(
            take(1),
            filter((t) => !!t),
            switchMap((newToken) => {
              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` },
              });
              return next(retryReq);
            })
          );
        }
      }

      return throwError(() => err);
    })
  );
};
