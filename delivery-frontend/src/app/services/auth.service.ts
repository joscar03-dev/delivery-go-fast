import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap, switchMap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../environments/environment';
import type { User } from '../models/user.model';
import { Router } from '@angular/router';

type TokenPayload = {
  sub?: string | number;
  email?: string;
  role?: string | string[];
  roles?: string[];
  exp?: number;
  [k: string]: any;
};

type RawAuthResponse = {
  access_token?: string;
  refresh_token?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: Partial<User> & { id?: string | number };
  [k: string]: any;
};

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name?: string;
  email: string;
  password: string;
  role?: User['role'];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private base = environment.apiUrl.replace(/\/$/, '');

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  currentUser$ = this.currentUserSubject.asObservable();
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor() {
    // Rehidratar sesión desde storage
    const access = this.getAccessToken();
    const storedUser = this.getStoredUser();
    if (access && storedUser) {
      this.currentUserSubject.next(storedUser);
      this.isAuthenticatedSubject.next(true);
    }
  }

  // Útil para flujos imperativos (ej: botón "Hacer pedido"): si no hay sesión, redirige a login con return URL
  ensureAuthenticated(redirectUrl?: string): boolean {
    const token = this.getAccessToken();
    if (token) return true;
    const target = redirectUrl ?? this.router.url ?? '/tabs';
    this.router.navigate(['/auth/login'], {
      queryParams: { redirectUrl: target },
      replaceUrl: true,
    });
    return false;
  }

  login(dto: LoginDto): Observable<User> {
    return this.http
      .post<RawAuthResponse>(`${this.base}/auth/login`, dto)
      .pipe(map((res) => this.handleAuthResponse(res)));
  }

  register(dto: RegisterDto): Observable<User> {
    // El backend devuelve solo mensaje/rol; no tokens.
    // Encadenamos auto-login para obtener tokens y materializar el usuario.
    return this.http
      .post(`${this.base}/auth/register`, dto)
      .pipe(
        switchMap(() =>
          this.login({ email: dto.email, password: dto.password })
        )
      );
  }

  refresh(): Observable<string> {
    const refreshToken = this.getRefreshToken();
    return this.http
      .post<RawAuthResponse>(`${this.base}/auth/refresh`, {
        refreshToken,
      })
      .pipe(
        map((res) => this.normalizeTokens(res).accessToken),
        tap((accessToken) => this.setAccessToken(accessToken))
      );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    // Redirigir a la pantalla principal (tabs) sin recargar
    this.router.navigateByUrl('/tabs');
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  hasRole(
    role: NonNullable<User['role']> | NonNullable<User['role']>[]
  ): boolean {
    const user = this.currentUserSubject.value;
    if (!user || !user.role) return false;
    const wanted = Array.isArray(role) ? role : [role];
    return wanted.includes(user.role);
  }

  private handleAuthResponse(res: RawAuthResponse): User {
    const tokens = this.normalizeTokens(res);
    const decoded = this.safeDecode(tokens.accessToken);
    const user = this.buildUser(decoded, res.user);
    this.persistSession(tokens.accessToken, tokens.refreshToken, user);
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
    return user;
  }

  private normalizeTokens(res: RawAuthResponse): {
    accessToken: string;
    refreshToken: string;
  } {
    const accessToken = (res.access_token ?? res.accessToken ?? '').toString();
    const refreshToken = (
      res.refresh_token ??
      res.refreshToken ??
      ''
    ).toString();
    if (!accessToken) throw new Error('Access token ausente en la respuesta');
    return { accessToken, refreshToken };
  }

  private safeDecode(token?: string): TokenPayload | null {
    if (!token) return null;
    try {
      return jwtDecode<TokenPayload>(token);
    } catch {
      return null;
    }
  }

  private buildUser(
    payload: TokenPayload | null,
    fallback?: Partial<User> & { id?: string | number }
  ): User {
    const roleFromToken = Array.isArray(payload?.roles)
      ? payload?.roles?.[0]
      : Array.isArray(payload?.role)
      ? (payload?.role as string[])[0]
      : (payload?.role as string | undefined);

    const id = (fallback?.id ?? payload?.sub ?? '').toString();
    return {
      id,
      name: fallback?.name ?? '',
      email: (fallback?.email ?? payload?.email ?? '').toString(),
      role: (roleFromToken as User['role']) ?? fallback?.role,
      avatarUrl: fallback?.avatarUrl,
      accessToken: undefined, // no exponer tokens en el modelo por defecto
      refreshToken: undefined,
    };
  }

  private persistSession(
    accessToken: string,
    refreshToken: string,
    user: User
  ) {
    this.setAccessToken(accessToken);
    if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
  }

  private setAccessToken(token: string) {
    localStorage.setItem('access_token', token);
  }

  private getStoredUser(): User | null {
    try {
      const raw = localStorage.getItem('user');
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }
}
