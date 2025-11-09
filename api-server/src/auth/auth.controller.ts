import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  PhoneLoginDto,
  PhoneRegisterDto,
  AddPhoneDto,
} from './dto/phone-auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ✅ ENDPOINTS EXISTENTES - EMAIL/PASSWORD AUTHENTICATION

  @Post('register')
  register(@Body() registerDto: RegisterAuthDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  //   @UseGuards(JwtAuthGuard)
  login(@Body() loginDto: LoginAuthDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post('create-super-admin')
  createSuperAdmin(@Body() registerDto: RegisterAuthDto) {
    return this.authService.createSuperAdmin(registerDto);
  }

  @Post('create-driver')
  createDriver(@Body() registerDto: RegisterAuthDto) {
    return this.authService.createDriver(registerDto);
  }

  @Post('create-restaurant-owner')
  createRestaurantOwner(@Body() registerDto: RegisterAuthDto) {
    return this.authService.createRestaurantOwner(registerDto);
  }

  // 🆕 PHONE AUTHENTICATION ENDPOINTS

  /**
   * Login con teléfono + Firebase token
   * POST /auth/phone/login
   *
   * Body:
   * {
   *   "phone": "+51987654321",
   *   "firebaseToken": "eyJhbGci..."
   * }
   */
  @Post('phone/login')
  loginWithPhone(@Body() phoneLoginDto: PhoneLoginDto) {
    return this.authService.loginWithPhone(phoneLoginDto);
  }

  /**
   * Registro con teléfono + Firebase token
   * POST /auth/phone/register
   *
   * Body:
   * {
   *   "name": "Juan Pérez",
   *   "phone": "+51987654321",
   *   "firebaseToken": "eyJhbGci..."
   * }
   */
  @Post('phone/register')
  registerWithPhone(@Body() phoneRegisterDto: PhoneRegisterDto) {
    return this.authService.registerWithPhone(phoneRegisterDto);
  }

  /**
   * Agregar teléfono a usuario existente
   * POST /auth/phone/add
   * Requiere autenticación (JwtAuthGuard)
   *
   * Body:
   * {
   *   "phone": "+51927885314",
   *   "firebaseToken": "eyJhbGci..."
   * }
   */
  @Post('phone/add')
  @UseGuards(JwtAuthGuard)
  addPhoneToUser(@Body() addPhoneDto: AddPhoneDto, @Request() req: any) {
    // El userId viene del JWT token después de la autenticación
    const userId = req.user?.sub || req.user?.id;
    return this.authService.addPhoneToUser(
      userId,
      addPhoneDto.phone,
      addPhoneDto.firebaseToken,
    );
  }
}
