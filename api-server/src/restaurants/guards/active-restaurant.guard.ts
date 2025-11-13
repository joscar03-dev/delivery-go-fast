import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { RestaurantsService } from '../../restaurants/restaurants.service';

/**
 * Guard para validar que el restaurante esté activo
 * Debe usarse en endpoints que requieren un restaurante activo
 */
@Injectable()
export class ActiveRestaurantGuard implements CanActivate {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Obtener el ID del restaurante desde los params
    const restaurantId = request.params.id || request.params.restaurantId;

    if (!restaurantId) {
      // Si no hay ID de restaurante, permitir que continúe
      // (otros guards pueden manejar la validación)
      return true;
    }

    // Buscar restaurante en BD
    const restaurant = await this.restaurantsService.findOne(restaurantId);

    if (!restaurant.isActive) {
      throw new ForbiddenException(
        'El restaurante no está disponible en este momento',
      );
    }

    // Guardar el restaurante en el request para uso posterior
    request.restaurant = restaurant;

    return true;
  }
}
