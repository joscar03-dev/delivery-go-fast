import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { ConfigService } from '@nestjs/config';
import { Role } from '../common/enums/role.enum';
import { OtpService } from './services/otp.service';
import { PhoneLoginDto, PhoneRegisterDto } from './dto/phone-auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
  ) {}

  async register(registerDto: RegisterAuthDto) {
    const userExists = await this.usersService.findOneByEmail(
      registerDto.email,
    );
    if (userExists) {
      throw new ConflictException('El correo electrónico ya está en uso');
    }
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Usar el rol del DTO o CLIENT por defecto
    const roleToAssign = registerDto.role || Role.CLIENT;
    await this.usersService.create(registerDto, hashedPassword, roleToAssign);

    return {
      message: 'Usuario registrado exitosamente',
      role: roleToAssign,
    };
  }

  async createSuperAdmin(registerDto: RegisterAuthDto) {
    const userExists = await this.usersService.findOneByEmail(
      registerDto.email,
    );
    if (userExists) {
      throw new ConflictException('El correo electrónico ya está en uso');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    await this.usersService.create(
      registerDto,
      hashedPassword,
      Role.SUPER_ADMIN,
    );

    return { message: 'Super administrador creado exitosamente' };
  }

  async createDriver(registerDto: RegisterAuthDto) {
    const userExists = await this.usersService.findOneByEmail(
      registerDto.email,
    );
    if (userExists) {
      throw new ConflictException('El correo electrónico ya está en uso');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    await this.usersService.create(registerDto, hashedPassword, Role.DRIVER);

    return {
      message: 'Repartidor creado exitosamente',
      role: Role.DRIVER,
    };
  }

  async createRestaurantOwner(registerDto: RegisterAuthDto) {
    const userExists = await this.usersService.findOneByEmail(
      registerDto.email,
    );
    if (userExists) {
      throw new ConflictException('El correo electrónico ya está en uso');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    await this.usersService.create(
      registerDto,
      hashedPassword,
      Role.RESTAURANT_OWNER,
    );

    return {
      message: 'Propietario de restaurante creado exitosamente',
      role: Role.RESTAURANT_OWNER,
    };
  }

  async login(loginDto: LoginAuthDto) {
    const user = await this.usersService.findOneByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password_hash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role?.name || 'CLIENT',
    };
    return await this._generateTokens(payload);
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // Verificar si el usuario aún existe en la DB
      const user = await this.usersService.findOneByEmail(payload.email);
      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado');
      }

      // Verificar si el refresh token coincide con el almacenado en la DB
      if (!user.hashedRefreshToken) {
        throw new UnauthorizedException('Token de refresco no válido');
      }

      const isRefreshTokenValid = await bcrypt.compare(
        refreshToken,
        user.hashedRefreshToken,
      );
      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Token de refresco no válido');
      }

      // Generar nuevos tokens usando el método privado
      const newPayload = {
        sub: user.id,
        email: user.email,
        role: user.role?.name || 'CLIENT',
      };
      return await this._generateTokens(newPayload);
    } catch {
      throw new UnauthorizedException('Token de refresco inválido o expirado');
    }
  }

  async logout(userId: string) {
    // Limpiar el refresh token de la base de datos
    await this.usersService.updateRefreshToken(userId, null);
    return { message: 'Logout exitoso' };
  }

  private async _generateTokens(payload: {
    sub: string;
    email?: string;
    phone?: string;
    role?: string;
  }) {
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>(
        'JWT_ACCESS_TOKEN_EXPIRATION_TIME',
      ),
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>(
        'JWT_REFRESH_TOKEN_EXPIRATION_TIME',
      ),
    });

    const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS');
    const hashedRefreshToken = await bcrypt.hash(refreshToken, saltRounds);
    await this.usersService.updateRefreshToken(payload.sub, hashedRefreshToken);

    return { accessToken, refreshToken };
  }

  // 🆕 PHONE AUTHENTICATION METHODS

  /**
   * Login con teléfono + Firebase token
   * Verifica el OTP a través de Firebase Admin SDK
   */
  async loginWithPhone(phoneLoginDto: PhoneLoginDto) {
    const { phone, firebaseToken } = phoneLoginDto;

    this.logger.log(`🔐 Intento de login con teléfono: ${phone}`);

    // 1. Verificar el token de Firebase y el teléfono
    await this.otpService.verifyPhoneNumber(firebaseToken, phone);

    // 2. Buscar usuario por teléfono
    const user = await this.usersService.findOneByPhone(phone);

    if (!user) {
      this.logger.warn(`⚠️ Usuario no encontrado con teléfono: ${phone}`);
      throw new UnauthorizedException(
        'Usuario no registrado. Por favor regístrate primero.',
      );
    }

    // 3. Actualizar phone_verified si no lo estaba
    if (!user.phoneVerified) {
      this.logger.log(`📱 Verificando teléfono para usuario: ${user.id}`);
      await this.usersService.updatePhoneVerified(user.id, true);
      user.phoneVerified = true;
    }

    // 4. Generar tokens JWT (IDÉNTICOS a login email)
    const payload = {
      sub: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role?.name || 'CLIENT',
    };

    const tokens = await this._generateTokens(payload);

    this.logger.log(`✅ Login exitoso para usuario: ${user.id} (phone)`);

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        phoneVerified: user.phoneVerified,
        authMethod: user.authMethod,
        role: user.role,
      },
    };
  }

  /**
   * Registro con teléfono
   * Crea un nuevo usuario después de verificar el OTP con Firebase
   */
  async registerWithPhone(phoneRegisterDto: PhoneRegisterDto) {
    const { phone, firebaseToken, name } = phoneRegisterDto;

    this.logger.log(`📝 Intento de registro con teléfono: ${phone}`);

    // 1. Verificar el token de Firebase y el teléfono
    await this.otpService.verifyPhoneNumber(firebaseToken, phone);

    // 2. Verificar que no exista usuario con ese teléfono
    const existingUser = await this.usersService.findOneByPhone(phone);

    if (existingUser) {
      this.logger.warn(`⚠️ Teléfono ya registrado: ${phone}`);
      throw new ConflictException(
        'Ya existe un usuario con este número de teléfono',
      );
    }

    // 3. Crear nuevo usuario con phone authentication
    const newUser = await this.usersService.createWithPhone({
      name,
      phone,
      phoneVerified: true,
      authMethod: 'phone',
      role: Role.CLIENT, // Rol por defecto
    });

    this.logger.log(`✅ Usuario creado exitosamente: ${newUser.id} (phone)`);

    // 4. Generar tokens JWT
    const payload = {
      sub: newUser.id,
      phone: newUser.phone,
      role: newUser.role?.name || 'CLIENT',
    };

    const tokens = await this._generateTokens(payload);

    return {
      ...tokens,
      user: {
        id: newUser.id,
        name: newUser.name,
        phone: newUser.phone,
        phoneVerified: newUser.phoneVerified,
        authMethod: newUser.authMethod,
        role: newUser.role,
      },
    };
  }

  /**
   * Agregar teléfono a un usuario existente (con email)
   * Permite migración de usuarios email → híbrido
   */
  async addPhoneToUser(userId: string, phone: string, firebaseToken: string) {
    this.logger.log(`📱 Agregando teléfono al usuario: ${userId}`);

    // 1. Verificar el token de Firebase y el teléfono
    await this.otpService.verifyPhoneNumber(firebaseToken, phone);

    // 2. Verificar que el teléfono no esté en uso
    const existingUser = await this.usersService.findOneByPhone(phone);

    if (existingUser && existingUser.id !== userId) {
      throw new ConflictException('Este número de teléfono ya está en uso');
    }

    // 3. Actualizar usuario con el teléfono
    await this.usersService.updatePhone(userId, phone, true);

    this.logger.log(`✅ Teléfono agregado exitosamente al usuario: ${userId}`);

    return {
      message: 'Teléfono agregado y verificado exitosamente',
      phone,
      phoneVerified: true,
    };
  }
}
