import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  // Este método se llama después de que el token se valida con éxito
  async validate(payload: {
    sub: string;
    email?: string;
    phone?: string;
    role: string;
  }) {
    // ✅ BUSCAR POR ID (sub) en lugar de email
    // Esto funciona tanto para usuarios con email como con solo teléfono
    const user = await this.usersService.findOneById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Tu cuenta ha sido desactivada. Contacta al administrador.',
      );
    }

    // Lo que retornes aquí se adjuntará al objeto request (request.user)
    return {
      sub: payload.sub,
      id: user.id,
      userId: user.id, // ⬅️ AGREGAR userId para compatibilidad
      email: user.email,
      phone: user.phone,
      role: user.role?.name ?? Role.CLIENT,
      name: user.name,
    };
  }
}
