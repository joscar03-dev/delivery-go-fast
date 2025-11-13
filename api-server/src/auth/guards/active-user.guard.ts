import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../../users/users.service';

/**
 * Guard para validar que el usuario autenticado esté activo
 * Se debe usar DESPUÉS de JwtAuthGuard
 */
@Injectable()
export class ActiveUserGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub || request.user?.id;

    if (!userId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    // Buscar usuario en BD para verificar estado actual
    const user = await this.usersService.findOneById(userId);

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Tu cuenta ha sido desactivada. Contacta al administrador.',
      );
    }

    return true;
  }
}
