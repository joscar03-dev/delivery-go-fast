import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Obtener los roles requeridos para la ruta desde el decorador @Roles
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si la ruta no tiene el decorador @Roles, se permite el acceso
    if (!requiredRoles) {
      return true;
    }

    // 2. Obtener el usuario del objeto request (adjuntado por JwtAuthGuard)
    const { user } = context.switchToHttp().getRequest();

    // 3. Comparar los roles del usuario con los roles requeridos
    // (Asumimos que user.role.name contiene el nombre del rol)
    const hasRole = () =>
      requiredRoles.some((role) => user.role?.name === role);

    return user && user.role && hasRole();
  }
}
