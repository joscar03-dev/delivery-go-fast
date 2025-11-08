# 📱 Sistema Híbrido de Autenticación - Phone OTP + Email/Password

## 📋 Resumen Ejecutivo

Este documento describe la implementación de un **sistema híbrido de autenticación** que permite a los usuarios iniciar sesión con:

- **Teléfono + OTP** (método moderno, recomendado)
- **Email + Password** (método tradicional, mantenido para compatibilidad)

### ✅ Garantías de Compatibilidad

- ✅ **Sistema JWT actual NO cambia**
- ✅ **Usuarios existentes siguen funcionando**
- ✅ **Login/Register actual intacto**
- ✅ **Roles y permisos sin modificar**
- ✅ **Admin panel sin cambios**
- ✅ **Socket.IO sin cambios**

---

## 🏗️ Arquitectura del Sistema

### Diagrama de Flujo Completo

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Angular + Ionic)               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────────────────┐         ┌──────────────────┐        │
│   │  Landing Page    │         │  Login Page      │        │
│   │                  │         │                  │        │
│   │ [📱 Con Teléfono]│────────▶│ Email: _______   │        │
│   │ [📧 Con Email]   │         │ Pass:  _______   │        │
│   └──────────────────┘         │ [Iniciar Sesión] │        │
│           │                     └──────────────────┘        │
│           │                              │                   │
│           │                              ├─────────────┐    │
│           ▼                              │ AuthService │    │
│   ┌──────────────────┐                   │ .login()    │    │
│   │ Phone Login Page │                   └─────────────┘    │
│   │                  │                                       │
│   │ Tel: +51 _____   │◀────┐                                │
│   │ [Enviar Código]  │     │                                │
│   │                  │     │                                │
│   │ OTP: [_][_][_][_]│     │  PhoneAuthService              │
│   │      [_][_]      │     │  (Firebase SDK)                │
│   │ [Verificar]      │─────┘                                │
│   └──────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    FIREBASE (Google Cloud)                   │
├─────────────────────────────────────────────────────────────┤
│   Firebase Phone Auth + reCAPTCHA                           │
│   - Envía SMS con código OTP                                │
│   - Valida código ingresado                                 │
│   - Retorna Firebase User Token                             │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (NestJS + TypeORM)               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              AuthController                          │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  ✅ POST /auth/login          (Email/Password)      │   │
│  │  ✅ POST /auth/register       (Email/Password)      │   │
│  │  ✅ POST /auth/refresh        (Refresh Token)       │   │
│  │  🆕 POST /auth/phone/verify   (Phone + OTP)         │   │
│  │  🆕 POST /auth/phone/register (Phone + Name)        │   │
│  └─────────────────────────────────────────────────────┘   │
│                        │                                     │
│                        ▼                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              AuthService                             │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  ✅ login(email, password)      → JWT Tokens        │   │
│  │  ✅ register(email, password)   → User + JWT        │   │
│  │  🆕 loginWithPhone(phone, otp)  → JWT Tokens        │   │
│  │  🆕 registerWithPhone(phone)    → User + JWT        │   │
│  │                                                      │   │
│  │  🔑 generateTokens(user) → {                        │   │
│  │       accessToken: JWT,                             │   │
│  │       refreshToken: JWT                             │   │
│  │     }                                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                        │                                     │
│                        ▼                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              OtpService (Firebase Admin SDK)         │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  verifyOtp(phone, code) → boolean                   │   │
│  │  verifyFirebaseToken(token) → DecodedToken          │   │
│  └─────────────────────────────────────────────────────┘   │
│                        │                                     │
│                        ▼                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         PostgreSQL Database (users table)            │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  id            UUID PRIMARY KEY                      │   │
│  │  name          VARCHAR NOT NULL                      │   │
│  │  email         VARCHAR UNIQUE         (nullable)     │   │
│  │  password      VARCHAR                (nullable)     │   │
│  │  phone         VARCHAR(20) UNIQUE     (nullable) 🆕  │   │
│  │  phone_verified BOOLEAN DEFAULT false         🆕     │   │
│  │  auth_method   VARCHAR(20) DEFAULT 'email'    🆕     │   │
│  │  role          ENUM (client, driver, admin)          │   │
│  │  created_at    TIMESTAMP                             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujos de Autenticación

### 1️⃣ Flujo Email/Password (Actual - Sin Cambios)

```typescript
// Frontend
authService.login(email, password)
  ↓
// Backend: POST /auth/login
AuthService.login(loginDto)
  → Valida email existe
  → Compara password con bcrypt
  → Genera JWT tokens
  → Retorna { accessToken, refreshToken, user }
  ↓
// Frontend almacena tokens y navega a /tabs
```

### 2️⃣ Flujo Phone + OTP (Nuevo)

```typescript
// PASO 1: Enviar OTP (Frontend con Firebase)
phoneAuthService.sendOTP('+51987654321')
  ↓
Firebase Phone Auth
  → Envía SMS con código
  → Retorna verificationId
  ↓
// Usuario recibe SMS: "Tu código es: 123456"

// PASO 2: Verificar OTP y Login
phoneAuthService.verifyOTP(verificationId, '123456')
  ↓
Firebase valida código
  → Retorna Firebase ID Token
  ↓
// Frontend envía al backend
authService.loginWithPhone(phone, firebaseToken)
  ↓
// Backend: POST /auth/phone/verify
OtpService.verifyFirebaseToken(firebaseToken)
  → Valida token con Firebase Admin SDK
  → Confirma que phone coincide
  ↓
AuthService.loginWithPhone(phone)
  → Busca usuario por phone
  → Si no existe: crea usuario automático
  → Genera JWT tokens (IDÉNTICOS a login email)
  → Retorna { accessToken, refreshToken, user }
  ↓
// Frontend almacena tokens y navega a /tabs
```

---

## 📊 Comparación de Métodos

| Característica        | Email/Password                | Phone OTP                               |
| --------------------- | ----------------------------- | --------------------------------------- |
| **Seguridad**         | Media (depende de contraseña) | Alta (código temporal)                  |
| **UX Móvil**          | 5 taps + teclado completo     | 3 taps + teclado numérico               |
| **Tiempo Login**      | ~20 segundos                  | ~10 segundos                            |
| **Olvido Contraseña** | Requiere flujo de reset       | No aplica                               |
| **Verificación**      | Email (a veces spam)          | SMS (99% delivery)                      |
| **Costo por Login**   | $0                            | $0.0075 (Firebase gratis hasta 10k/mes) |
| **Ideal para**        | Admin, Web desktop            | Clientes, Drivers móviles               |

---

## 🗄️ Cambios en Base de Datos

### Migración SQL

```sql
-- migrations/add-phone-authentication.sql

-- Agregar campos para phone authentication
ALTER TABLE users
ADD COLUMN phone VARCHAR(20) UNIQUE,
ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN auth_method VARCHAR(20) DEFAULT 'email';

-- Crear índice para búsquedas por teléfono
CREATE INDEX idx_users_phone ON users(phone) WHERE phone IS NOT NULL;

-- Comentarios
COMMENT ON COLUMN users.phone IS 'Número de teléfono con código de país (ej: +51987654321)';
COMMENT ON COLUMN users.phone_verified IS 'TRUE si el teléfono fue verificado con OTP';
COMMENT ON COLUMN users.auth_method IS 'Método de autenticación: email, phone, o social';

-- Los usuarios existentes automáticamente tienen auth_method='email'
-- No se requiere migración de datos
```

### Modelo Actualizado

```typescript
// ANTES
interface User {
  id: string;
  name: string;
  email: string; // REQUIRED
  password: string; // REQUIRED
  role: "client" | "driver" | "admin";
  createdAt: Date;
}

// DESPUÉS (BACKWARD COMPATIBLE)
interface User {
  id: string;
  name: string;
  email?: string; // OPTIONAL - usuarios con phone pueden no tener email
  password?: string; // OPTIONAL - usuarios con phone no tienen password
  phone?: string; // OPTIONAL - usuarios con email pueden no tener phone
  phoneVerified?: boolean; // Indica si phone fue verificado
  authMethod: "email" | "phone" | "social";
  role: "client" | "driver" | "admin";
  createdAt: Date;
}
```

---

## 🔐 Implementación Backend (NestJS)

### 1. Entidad User Actualizada

```typescript
// src/auth/entities/user.entity.ts

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from "typeorm";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ unique: true, nullable: true })
  email?: string;

  @Column({ nullable: true })
  password?: string;

  @Column({
    name: "phone",
    type: "varchar",
    length: 20,
    unique: true,
    nullable: true,
  })
  @Index("idx_users_phone")
  phone?: string;

  @Column({ name: "phone_verified", type: "boolean", default: false })
  phoneVerified: boolean;

  @Column({
    name: "auth_method",
    type: "varchar",
    length: 20,
    default: "email",
  })
  authMethod: "email" | "phone" | "social";

  @Column({
    type: "enum",
    enum: ["client", "driver", "admin"],
    default: "client",
  })
  role: "client" | "driver" | "admin";

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
```

### 2. OTP Service con Firebase Admin

```typescript
// src/auth/services/otp.service.ts

import { Injectable, UnauthorizedException } from "@nestjs/common";
import * as admin from "firebase-admin";

@Injectable()
export class OtpService {
  private readonly auth: admin.auth.Auth;

  constructor() {
    // Inicializar Firebase Admin con tu service account
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
    }
    this.auth = admin.auth();
  }

  /**
   * Verifica el token de Firebase generado en el frontend
   * después de que el usuario completa el flujo de OTP
   */
  async verifyFirebaseToken(
    idToken: string
  ): Promise<admin.auth.DecodedIdToken> {
    try {
      const decodedToken = await this.auth.verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      throw new UnauthorizedException("Token de Firebase inválido o expirado");
    }
  }

  /**
   * Verifica que el teléfono del token coincida con el esperado
   */
  async verifyPhoneNumber(
    idToken: string,
    expectedPhone: string
  ): Promise<boolean> {
    const decodedToken = await this.verifyFirebaseToken(idToken);

    // Firebase guarda el phone con +código de país
    const tokenPhone = decodedToken.phone_number;

    if (tokenPhone !== expectedPhone) {
      throw new UnauthorizedException("El número de teléfono no coincide");
    }

    return true;
  }
}
```

### 3. DTOs para Phone Auth

```typescript
// src/auth/dto/phone-login.dto.ts

import { IsString, IsNotEmpty, Matches } from "class-validator";

export class PhoneLoginDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: "El teléfono debe estar en formato E.164 (ej: +51987654321)",
  })
  phone: string;

  @IsString()
  @IsNotEmpty()
  firebaseToken: string; // Token generado por Firebase después de verificar OTP
}

export class PhoneRegisterDto extends PhoneLoginDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
```

### 4. AuthService - Métodos para Phone

```typescript
// src/auth/auth.service.ts

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";
import { OtpService } from "./services/otp.service";
import { PhoneLoginDto, PhoneRegisterDto } from "./dto/phone-login.dto";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private otpService: OtpService
  ) // ... otros servicios existentes
  {}

  // ✅ MÉTODOS EXISTENTES - NO MODIFICAR
  async login(loginDto: LoginDto) {
    /* ... código actual ... */
  }
  async register(registerDto: RegisterDto) {
    /* ... código actual ... */
  }
  async refresh(refreshToken: string) {
    /* ... código actual ... */
  }

  // 🆕 NUEVOS MÉTODOS PARA PHONE AUTH

  /**
   * Login con teléfono verificado por OTP
   */
  async loginWithPhone(phoneLoginDto: PhoneLoginDto) {
    const { phone, firebaseToken } = phoneLoginDto;

    // 1. Verificar el token de Firebase
    await this.otpService.verifyPhoneNumber(firebaseToken, phone);

    // 2. Buscar usuario por teléfono
    let user = await this.usersRepository.findOne({
      where: { phone },
    });

    // 3. Si no existe, crear usuario automáticamente
    if (!user) {
      throw new UnauthorizedException(
        "Usuario no registrado. Por favor regístrate primero."
      );
    }

    // 4. Actualizar phone_verified si no lo estaba
    if (!user.phoneVerified) {
      user.phoneVerified = true;
      await this.usersRepository.save(user);
    }

    // 5. Generar tokens JWT (IDÉNTICOS a login email)
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  /**
   * Registro con teléfono
   */
  async registerWithPhone(phoneRegisterDto: PhoneRegisterDto) {
    const { phone, firebaseToken, name } = phoneRegisterDto;

    // 1. Verificar el token de Firebase
    await this.otpService.verifyPhoneNumber(firebaseToken, phone);

    // 2. Verificar que no exista usuario con ese teléfono
    const existingUser = await this.usersRepository.findOne({
      where: { phone },
    });

    if (existingUser) {
      throw new ConflictException("Ya existe un usuario con este teléfono");
    }

    // 3. Crear nuevo usuario
    const user = this.usersRepository.create({
      name,
      phone,
      phoneVerified: true,
      authMethod: "phone",
      role: "client", // Rol por defecto
    });

    await this.usersRepository.save(user);

    // 4. Generar tokens JWT
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  /**
   * Buscar usuario por teléfono
   */
  async findByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { phone },
    });
  }

  // Método existente - sin cambios
  private async generateTokens(user: User) {
    // ... código actual que genera accessToken y refreshToken
  }

  private sanitizeUser(user: User) {
    const { password, ...result } = user;
    return result;
  }
}
```

### 5. AuthController - Nuevos Endpoints

```typescript
// src/auth/auth.controller.ts

import { Controller, Post, Body } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { PhoneLoginDto, PhoneRegisterDto } from "./dto/phone-login.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ✅ ENDPOINTS EXISTENTES - NO MODIFICAR
  @Post("login")
  async login(@Body() loginDto: LoginDto) {
    /* ... */
  }

  @Post("register")
  async register(@Body() registerDto: RegisterDto) {
    /* ... */
  }

  @Post("refresh")
  async refresh(@Body() body: { refreshToken: string }) {
    /* ... */
  }

  // 🆕 NUEVOS ENDPOINTS PARA PHONE AUTH

  /**
   * Login con teléfono + Firebase token
   * POST /auth/phone/login
   */
  @Post("phone/login")
  async loginWithPhone(@Body() phoneLoginDto: PhoneLoginDto) {
    return this.authService.loginWithPhone(phoneLoginDto);
  }

  /**
   * Registro con teléfono + Firebase token
   * POST /auth/phone/register
   */
  @Post("phone/register")
  async registerWithPhone(@Body() phoneRegisterDto: PhoneRegisterDto) {
    return this.authService.registerWithPhone(phoneRegisterDto);
  }
}
```

---

## 📱 Implementación Frontend (Angular + Ionic)

### 1. Configuración de Firebase

```typescript
// src/environments/environment.ts

export const environment = {
  production: false,
  apiUrl: "http://localhost:3000",

  // 🆕 Configuración de Firebase
  firebase: {
    apiKey: "AIzaSy...", // Tu API Key
    authDomain: "delivery-go-fast.firebaseapp.com",
    projectId: "delivery-go-fast",
    storageBucket: "delivery-go-fast.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123",
  },
};
```

### 2. PhoneAuthService

```typescript
// src/app/core/services/phone-auth.service.ts

import { Injectable } from "@angular/core";
import {
  Auth,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
} from "@angular/fire/auth";
import { from, Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class PhoneAuthService {
  private recaptchaVerifier!: RecaptchaVerifier;
  private confirmationResult?: ConfirmationResult;

  constructor(private auth: Auth) {}

  /**
   * Inicializa reCAPTCHA invisible
   */
  initRecaptcha(containerId: string = "recaptcha-container"): void {
    this.recaptchaVerifier = new RecaptchaVerifier(
      containerId,
      {
        size: "invisible",
        callback: () => {
          console.log("✅ reCAPTCHA verificado");
        },
      },
      this.auth
    );
  }

  /**
   * Envía código OTP al teléfono
   */
  sendOTP(phoneNumber: string): Observable<ConfirmationResult> {
    return from(
      signInWithPhoneNumber(
        this.auth,
        phoneNumber,
        this.recaptchaVerifier
      ).then((confirmationResult) => {
        this.confirmationResult = confirmationResult;
        console.log("✅ OTP enviado a", phoneNumber);
        return confirmationResult;
      })
    );
  }

  /**
   * Verifica el código OTP ingresado
   */
  verifyOTP(code: string): Observable<any> {
    if (!this.confirmationResult) {
      throw new Error("Primero debes enviar el código OTP");
    }

    return from(
      this.confirmationResult.confirm(code).then((result) => {
        console.log("✅ OTP verificado, usuario:", result.user);
        return result.user.getIdToken(); // Token de Firebase para enviar al backend
      })
    );
  }
}
```

### 3. AuthService - Integración con Phone

```typescript
// src/app/core/services/auth.service.ts

import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  // ✅ MÉTODOS EXISTENTES - NO MODIFICAR
  login(email: string, password: string): Observable<any> {
    /* ... */
  }
  register(userData: any): Observable<any> {
    /* ... */
  }
  refresh(): Observable<string> {
    /* ... */
  }

  // 🆕 NUEVOS MÉTODOS PARA PHONE AUTH

  /**
   * Login con teléfono después de verificar OTP
   */
  loginWithPhone(phone: string, firebaseToken: string): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/auth/phone/login`, {
        phone,
        firebaseToken,
      })
      .pipe(
        tap((response: any) => {
          // Almacenar tokens IGUAL que login email
          localStorage.setItem("access_token", response.accessToken);
          localStorage.setItem("refresh_token", response.refreshToken);
          localStorage.setItem("user", JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        })
      );
  }

  /**
   * Registro con teléfono después de verificar OTP
   */
  registerWithPhone(
    name: string,
    phone: string,
    firebaseToken: string
  ): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/auth/phone/register`, {
        name,
        phone,
        firebaseToken,
      })
      .pipe(
        tap((response: any) => {
          localStorage.setItem("access_token", response.accessToken);
          localStorage.setItem("refresh_token", response.refreshToken);
          localStorage.setItem("user", JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        })
      );
  }
}
```

### 4. Phone Login Page

```typescript
// src/app/pages/phone-login/phone-login.page.ts

import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { LoadingController, AlertController } from "@ionic/angular";
import { PhoneAuthService } from "../../core/services/phone-auth.service";
import { AuthService } from "../../core/services/auth.service";

@Component({
  selector: "app-phone-login",
  templateUrl: "./phone-login.page.html",
  styleUrls: ["./phone-login.page.scss"],
})
export class PhoneLoginPage implements OnInit {
  // Paso 1: Ingresar teléfono
  phoneNumber: string = "+51";
  codeSent: boolean = false;

  // Paso 2: Verificar código
  otpCode: string = "";
  countdown: number = 60;
  canResend: boolean = false;

  constructor(
    private phoneAuthService: PhoneAuthService,
    private authService: AuthService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.phoneAuthService.initRecaptcha();
  }

  /**
   * Envía el código OTP al teléfono
   */
  async sendCode() {
    // Validar formato
    if (!this.isValidPhone(this.phoneNumber)) {
      await this.showAlert(
        "Error",
        "Número de teléfono inválido. Usa formato +51987654321"
      );
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: "Enviando código...",
    });
    await loading.present();

    this.phoneAuthService.sendOTP(this.phoneNumber).subscribe({
      next: () => {
        loading.dismiss();
        this.codeSent = true;
        this.startCountdown();
      },
      error: async (error) => {
        loading.dismiss();
        await this.showAlert(
          "Error",
          "No se pudo enviar el código. Intenta nuevamente."
        );
        console.error("Error al enviar OTP:", error);
      },
    });
  }

  /**
   * Verifica el código OTP y hace login
   */
  async verifyCode() {
    if (this.otpCode.length !== 6) {
      await this.showAlert("Error", "Ingresa el código de 6 dígitos");
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: "Verificando código...",
    });
    await loading.present();

    this.phoneAuthService.verifyOTP(this.otpCode).subscribe({
      next: (firebaseToken: string) => {
        // Intentar login con el token de Firebase
        this.authService
          .loginWithPhone(this.phoneNumber, firebaseToken)
          .subscribe({
            next: () => {
              loading.dismiss();
              this.router.navigate(["/tabs"]);
            },
            error: async (error) => {
              loading.dismiss();

              // Si el usuario no existe, redirigir a completar perfil
              if (error.status === 401) {
                await this.showAlert(
                  "Usuario no encontrado",
                  "Parece que es tu primera vez. Completa tu perfil para continuar."
                );
                this.router.navigate(["/phone-register"], {
                  queryParams: {
                    phone: this.phoneNumber,
                    firebaseToken: firebaseToken,
                  },
                });
              } else {
                await this.showAlert(
                  "Error",
                  "No se pudo completar el inicio de sesión"
                );
              }
            },
          });
      },
      error: async (error) => {
        loading.dismiss();
        await this.showAlert("Error", "Código incorrecto. Intenta nuevamente.");
        console.error("Error al verificar OTP:", error);
      },
    });
  }

  /**
   * Valida formato E.164 del teléfono
   */
  private isValidPhone(phone: string): boolean {
    return /^\+[1-9]\d{1,14}$/.test(phone);
  }

  /**
   * Inicia el contador para reenviar código
   */
  private startCountdown() {
    this.countdown = 60;
    this.canResend = false;

    const interval = setInterval(() => {
      this.countdown--;
      if (this.countdown === 0) {
        this.canResend = true;
        clearInterval(interval);
      }
    }, 1000);
  }

  /**
   * Reenviar código OTP
   */
  async resendCode() {
    this.otpCode = "";
    await this.sendCode();
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ["OK"],
    });
    await alert.present();
  }
}
```

### 5. Phone Login Template

```html
<!-- src/app/pages/phone-login/phone-login.page.html -->

<ion-header>
  <ion-toolbar>
    <ion-buttons slot="start">
      <ion-back-button defaultHref="/"></ion-back-button>
    </ion-buttons>
    <ion-title>Iniciar Sesión</ion-title>
  </ion-toolbar>
</ion-header>

<ion-content class="ion-padding">
  <div class="login-container">
    <!-- Logo -->
    <div class="logo-container">
      <ion-icon
        name="phone-portrait-outline"
        size="large"
        color="primary"
      ></ion-icon>
      <h1>Ingresa con tu número</h1>
      <p>Te enviaremos un código de verificación</p>
    </div>

    <!-- PASO 1: Ingresar teléfono -->
    <div *ngIf="!codeSent">
      <ion-item>
        <ion-label position="stacked">Número de teléfono</ion-label>
        <ion-input
          type="tel"
          [(ngModel)]="phoneNumber"
          placeholder="+51987654321"
          [maxlength]="15"
        ></ion-input>
      </ion-item>

      <ion-button expand="block" (click)="sendCode()" class="ion-margin-top">
        Enviar código
      </ion-button>

      <div class="alternative-login ion-margin-top">
        <p>¿Prefieres iniciar con email?</p>
        <ion-button fill="outline" expand="block" routerLink="/login">
          Iniciar con Email
        </ion-button>
      </div>
    </div>

    <!-- PASO 2: Verificar código -->
    <div *ngIf="codeSent">
      <p class="text-center">
        Código enviado a <strong>{{ phoneNumber }}</strong>
      </p>

      <!-- Componente OTP Input -->
      <app-otp-input
        [(code)]="otpCode"
        (codeComplete)="verifyCode()"
      ></app-otp-input>

      <ion-button
        expand="block"
        (click)="verifyCode()"
        [disabled]="otpCode.length !== 6"
        class="ion-margin-top"
      >
        Verificar código
      </ion-button>

      <!-- Contador para reenviar -->
      <div class="resend-container ion-text-center ion-margin-top">
        <p *ngIf="!canResend">
          Reenviar código en <strong>{{ countdown }}s</strong>
        </p>
        <ion-button *ngIf="canResend" fill="clear" (click)="resendCode()">
          Reenviar código
        </ion-button>
      </div>
    </div>

    <!-- reCAPTCHA container (invisible) -->
    <div id="recaptcha-container"></div>
  </div>
</ion-content>
```

### 6. OTP Input Component

```typescript
// src/app/components/otp-input/otp-input.component.ts

import { Component, EventEmitter, Output, forwardRef } from "@angular/core";
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from "@angular/forms";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

@Component({
  selector: "app-otp-input",
  templateUrl: "./otp-input.component.html",
  styleUrls: ["./otp-input.component.scss"],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OtpInputComponent),
      multi: true,
    },
  ],
})
export class OtpInputComponent implements ControlValueAccessor {
  @Output() codeComplete = new EventEmitter<string>();

  digits: string[] = ["", "", "", "", "", ""];

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string): void {
    if (value) {
      this.digits = value.split("").slice(0, 6);
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  /**
   * Maneja el input de cada dígito
   */
  async onDigitInput(index: number, event: any) {
    const value = event.target.value;

    // Solo permitir números
    if (!/^\d*$/.test(value)) {
      this.digits[index] = "";
      return;
    }

    this.digits[index] = value.slice(-1); // Solo último carácter

    // Haptic feedback
    await Haptics.impact({ style: ImpactStyle.Light });

    // Auto-focus al siguiente campo
    if (value && index < 5) {
      const nextInput = document.getElementById(
        `otp-${index + 1}`
      ) as HTMLInputElement;
      nextInput?.focus();
    }

    // Emitir valor completo
    const code = this.digits.join("");
    this.onChange(code);

    // Si completó los 6 dígitos
    if (code.length === 6) {
      await Haptics.impact({ style: ImpactStyle.Medium });
      this.codeComplete.emit(code);
    }
  }

  /**
   * Maneja backspace
   */
  onKeyDown(index: number, event: KeyboardEvent) {
    if (event.key === "Backspace" && !this.digits[index] && index > 0) {
      const prevInput = document.getElementById(
        `otp-${index - 1}`
      ) as HTMLInputElement;
      prevInput?.focus();
    }
  }

  /**
   * Maneja paste de código completo
   */
  async onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData("text");

    if (pastedData && /^\d{6}$/.test(pastedData)) {
      this.digits = pastedData.split("");
      this.onChange(pastedData);
      await Haptics.impact({ style: ImpactStyle.Medium });
      this.codeComplete.emit(pastedData);
    }
  }
}
```

```html
<!-- src/app/components/otp-input/otp-input.component.html -->

<div class="otp-container">
  <input
    *ngFor="let digit of digits; let i = index"
    [id]="'otp-' + i"
    type="tel"
    maxlength="1"
    class="otp-digit"
    [value]="digit"
    (input)="onDigitInput(i, $event)"
    (keydown)="onKeyDown(i, $event)"
    (paste)="i === 0 ? onPaste($event) : null"
    autocomplete="one-time-code"
  />
</div>
```

```scss
/* src/app/components/otp-input/otp-input.component.scss */

.otp-container {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 20px 0;
}

.otp-digit {
  width: 45px;
  height: 55px;
  font-size: 24px;
  text-align: center;
  border: 2px solid var(--ion-color-medium);
  border-radius: 8px;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: var(--ion-color-primary);
    box-shadow: 0 0 0 3px rgba(var(--ion-color-primary-rgb), 0.1);
  }
}
```

---

## 🧪 Testing y Validación

### Backend Testing (Postman/Thunder Client)

```json
// 1. Registro con Phone
POST http://localhost:3000/auth/phone/register
Content-Type: application/json

{
  "name": "Juan Pérez",
  "phone": "+51987654321",
  "firebaseToken": "eyJhbGci..." // Token de Firebase después de verificar OTP
}

// Respuesta esperada:
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "user": {
    "id": "uuid",
    "name": "Juan Pérez",
    "phone": "+51987654321",
    "phoneVerified": true,
    "authMethod": "phone",
    "role": "client"
  }
}

// 2. Login con Phone
POST http://localhost:3000/auth/phone/login
Content-Type: application/json

{
  "phone": "+51987654321",
  "firebaseToken": "eyJhbGci..."
}
```

### Frontend Testing Checklist

- [ ] **Envío de OTP**: Ingresar teléfono → Recibir SMS con código
- [ ] **Verificación OTP**: Ingresar código correcto → Login exitoso
- [ ] **Código incorrecto**: Mostrar error apropiado
- [ ] **Countdown timer**: 60 segundos antes de permitir reenvío
- [ ] **Auto-focus**: Automático al siguiente campo al digitar
- [ ] **Paste**: Pegar código de 6 dígitos funciona
- [ ] **Haptic feedback**: Vibración al ingresar dígitos
- [ ] **Navegación**: Después de login → /tabs con rol 'client'
- [ ] **Token JWT**: Almacenado en localStorage
- [ ] **Refresh token**: Funciona igual que login email

### Compatibilidad Backward

- [ ] **Login email existente**: Sigue funcionando sin cambios
- [ ] **Usuarios existentes**: Pueden seguir iniciando con email
- [ ] **Admin panel**: Login con email funciona
- [ ] **Drivers existentes**: No afectados
- [ ] **Socket.IO**: Acepta JWT de ambos métodos
- [ ] **Roles**: System funciona idéntico con ambos métodos

---

## 💰 Costos y Límites

### Firebase Phone Auth (Gratis)

| Tier                  | Verificaciones/mes | Costo               | Ideal para                         |
| --------------------- | ------------------ | ------------------- | ---------------------------------- |
| Spark (Free)          | 10,000             | $0                  | Desarrollo, MVP, <300 usuarios/día |
| Blaze (Pay as you go) | Ilimitado          | $0.006/verificación | Producción, >10k/mes               |

### Alternativa: Twilio SMS

| Región | Costo por SMS | 1,000 usuarios | 10,000 usuarios |
| ------ | ------------- | -------------- | --------------- |
| Perú   | $0.0750       | $75            | $750            |
| USA    | $0.0079       | $7.90          | $79             |
| México | $0.0280       | $28            | $280            |

**Recomendación**: Usa Firebase gratis hasta 10k/mes, luego evalúa.

---

## 📈 Plan de Implementación por Fases

### ✅ FASE 1: Backend Foundation (Tareas 1-8)

- Agregar campos a BD
- Instalar Firebase Admin SDK
- Crear OtpService
- Crear endpoints /auth/phone/\*
- **Testing**: Postman verifica endpoints

### ✅ FASE 2: Frontend Integration (Tareas 9-13)

- Instalar Firebase SDK
- Crear PhoneAuthService
- Crear phone-login page
- Crear OTP input component
- **Testing**: Login completo funciona

### ✅ FASE 3: UX Improvements (Tareas 14-15)

- Agregar phone a perfil de usuarios existentes
- Configurar reCAPTCHA
- **Testing**: Usuarios migran de email a phone

### ✅ FASE 4: Production Ready (Tareas 16-20)

- Ejecutar migraciones en prod
- Testing exhaustivo ambos métodos
- Monitoreo de costos Firebase
- Documentación final

---

## 🚨 Troubleshooting

### Error: "reCAPTCHA verification failed"

**Solución**: Agregar dominio en Firebase Console → Authentication → Settings → Authorized domains

### Error: "Firebase token invalid"

**Solución**: Verificar que FIREBASE_PRIVATE_KEY en backend tenga saltos de línea (\n)

### Error: "Phone number format invalid"

**Solución**: Usar formato E.164 (+51987654321, no 987654321)

### SMS no llega

**Solución**: Verificar que el país está habilitado en Firebase Console → Authentication → Sign-in method → Phone

### Usuario no puede reenviar código

**Solución**: Implementar rate limiting: máximo 3 intentos cada 5 minutos

---

## 📚 Recursos Adicionales

- **Firebase Phone Auth Docs**: https://firebase.google.com/docs/auth/web/phone-auth
- **reCAPTCHA v3**: https://developers.google.com/recaptcha/docs/v3
- **E.164 Phone Format**: https://en.wikipedia.org/wiki/E.164
- **Twilio Pricing**: https://www.twilio.com/sms/pricing

---

## ✅ Checklist de Finalización

- [ ] Migración SQL ejecutada
- [ ] Firebase Admin SDK configurado
- [ ] Endpoints phone auth funcionando
- [ ] Frontend con phone-login page
- [ ] OTP input con UX completa
- [ ] reCAPTCHA configurado
- [ ] Testing backend (Postman)
- [ ] Testing frontend (dispositivo real)
- [ ] Testing compatibilidad (email login sigue funcionando)
- [ ] Documentación actualizada
- [ ] Monitoreo de costos Firebase
- [ ] Backup de BD antes de producción

---

**Última actualización**: 7 de noviembre de 2025  
**Versión**: 1.0  
**Estado**: Plan completo listo para ejecución
