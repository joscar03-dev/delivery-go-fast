import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { ConfigService } from '@nestjs/config';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterAuthDto) {
    const userExists = await this.usersService.findOneByEmail(
      registerDto.email,
    );
    if (userExists) {
      throw new ConflictException('El correo electrónico ya está en uso');
    }
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Por defecto, todos los usuarios registrados son CLIENT
    await this.usersService.create(registerDto, hashedPassword, Role.CLIENT);
    return { message: 'Usuario registrado exitosamente' };
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
    email: string;
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
}
