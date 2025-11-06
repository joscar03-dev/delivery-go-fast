import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { FindRestaurantsDto } from './dto/find-restaurants.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  // Endpoint para obtener los restaurantes del usuario autenticado
  // DEBE IR ANTES de @Get(':id') para evitar que 'my' sea capturado como ID
  @Get('my/restaurants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT_OWNER, Role.SUPER_ADMIN)
  findMyRestaurants(@Request() req) {
    console.log('👤 Usuario autenticado:', {
      userId: req.user.sub,
      email: req.user.email,
      role: req.user.role,
    });

    if (!req.user.sub) {
      throw new UnauthorizedException(
        'Token inválido: falta el ID del usuario. Por favor, cierra sesión y vuelve a iniciar sesión.',
      );
    }

    return this.restaurantsService.findByOwner(req.user.sub);
  }

  // Endpoints públicos
  @Get()
  findNearby(@Query() query: FindRestaurantsDto) {
    return this.restaurantsService.findNearby(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.restaurantsService.findOne(id);
  }

  @Get(':id/menu')
  findMenu(@Param('id') restaurantId: string) {
    return this.restaurantsService.findMenuItems(restaurantId);
  }

  // Endpoints para administradores y dueños de restaurante
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT_OWNER, Role.SUPER_ADMIN)
  create(@Body() createRestaurantDto: CreateRestaurantDto, @Request() req) {
    // Para RESTAURANT_OWNER, asignar automáticamente como owner
    // Para SUPER_ADMIN, usar el ownerId del body o el usuario actual
    const currentUser = req.user;

    if (currentUser.role === Role.RESTAURANT_OWNER) {
      // Si es RESTAURANT_OWNER, siempre asignar como owner
      return this.restaurantsService.create({
        ...createRestaurantDto,
        ownerId: currentUser.id, // Usar id en lugar de sub
      });
    } else {
      // Si es SUPER_ADMIN, usar ownerId del body o usuario actual como fallback
      return this.restaurantsService.create({
        ...createRestaurantDto,
        ownerId: createRestaurantDto.ownerId || currentUser.id,
      });
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT_OWNER, Role.SUPER_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateRestaurantDto: UpdateRestaurantDto,
    @Request() req,
  ) {
    const currentUser = req.user;

    if (currentUser.role === Role.RESTAURANT_OWNER) {
      // Verificar que el restaurante pertenezca al usuario actual
      const restaurant = await this.restaurantsService.findOne(id);

      if (restaurant.owner.id !== currentUser.sub) {
        throw new ForbiddenException(
          'No tienes permisos para actualizar este restaurante',
        );
      }

      // No permitir cambiar el owner si es RESTAURANT_OWNER
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { ownerId, ...allowedUpdates } = updateRestaurantDto;
      return this.restaurantsService.update(id, allowedUpdates);
    } else {
      // SUPER_ADMIN puede actualizar cualquier campo de cualquier restaurante
      return this.restaurantsService.update(id, updateRestaurantDto);
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.restaurantsService.remove(id);
  }

  // Endpoints para gestión de menú
  @Post(':id/menu')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT_OWNER, Role.SUPER_ADMIN)
  async createMenuItem(
    @Param('id') restaurantId: string,
    @Body() createMenuItemDto: CreateMenuItemDto,
    @Request() req,
  ) {
    const currentUser = req.user;

    if (currentUser.role === Role.RESTAURANT_OWNER) {
      // Verificar que el restaurante pertenezca al usuario actual
      const restaurant = await this.restaurantsService.findOne(restaurantId);

      if (restaurant.owner.id !== currentUser.sub) {
        throw new ForbiddenException(
          'No tienes permisos para gestionar el menú de este restaurante',
        );
      }
    }

    return this.restaurantsService.createMenuItem({
      ...createMenuItemDto,
      restaurantId,
    });
  }

  @Get(':restaurantId/menu/:itemId')
  findMenuItem(
    @Param('restaurantId') restaurantId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.restaurantsService.findMenuItem(restaurantId, itemId);
  }

  @Patch(':restaurantId/menu/:itemId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT_OWNER, Role.SUPER_ADMIN)
  async updateMenuItem(
    @Param('restaurantId') restaurantId: string,
    @Param('itemId') itemId: string,
    @Body() updateMenuItemDto: UpdateMenuItemDto,
    @Request() req,
  ) {
    const currentUser = req.user;

    if (currentUser.role === Role.RESTAURANT_OWNER) {
      // Verificar que el restaurante pertenezca al usuario actual
      const restaurant = await this.restaurantsService.findOne(restaurantId);

      if (restaurant.owner.id !== currentUser.sub) {
        throw new ForbiddenException(
          'No tienes permisos para gestionar el menú de este restaurante',
        );
      }
    }

    return this.restaurantsService.updateMenuItem(
      restaurantId,
      itemId,
      updateMenuItemDto,
    );
  }

  @Delete(':restaurantId/menu-items/:itemId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT_OWNER, Role.SUPER_ADMIN)
  async removeMenuItem(
    @Param('restaurantId') restaurantId: string,
    @Param('itemId') itemId: string,
    @Request() req,
  ) {
    const currentUser = req.user;

    if (currentUser.role === Role.RESTAURANT_OWNER) {
      // Verificar que el restaurante pertenezca al usuario actual
      const restaurant = await this.restaurantsService.findOne(restaurantId);

      if (restaurant.owner.id !== currentUser.sub) {
        throw new ForbiddenException(
          'No tienes permisos para gestionar el menú de este restaurante',
        );
      }
    }

    return this.restaurantsService.removeMenuItem(restaurantId, itemId);
  }

  // Endpoints para configuración de delivery
  @Get(':id/delivery-config')
  getDeliveryConfig(@Param('id') restaurantId: string) {
    return this.restaurantsService.getDeliveryConfig(restaurantId);
  }

  @Patch(':id/delivery-config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT_OWNER, Role.SUPER_ADMIN)
  async updateDeliveryConfig(
    @Param('id') restaurantId: string,
    @Body() updateDto: any,
    @Request() req,
  ) {
    const currentUser = req.user;

    if (currentUser.role === Role.RESTAURANT_OWNER) {
      // Verificar que el restaurante pertenezca al usuario actual
      const restaurant = await this.restaurantsService.findOne(restaurantId);

      if (restaurant.owner.id !== currentUser.sub) {
        throw new ForbiddenException(
          'No tienes permisos para configurar este restaurante',
        );
      }
    }

    return this.restaurantsService.updateDeliveryConfig(
      restaurantId,
      updateDto,
    );
  }
}
