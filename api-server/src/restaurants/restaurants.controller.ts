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
} from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { FindRestaurantsDto } from './dto/find-restaurants.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

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

  // Endpoints para administradores
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  create(@Body() createRestaurantDto: CreateRestaurantDto) {
    return this.restaurantsService.create(createRestaurantDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateRestaurantDto: UpdateRestaurantDto,
  ) {
    return this.restaurantsService.update(id, updateRestaurantDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.restaurantsService.remove(id);
  }

  // Endpoints para gestión de menú (solo administradores)
  @Post(':id/menu')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  createMenuItem(
    @Param('id') restaurantId: string,
    @Body() createMenuItemDto: CreateMenuItemDto,
  ) {
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
  @Roles(Role.SUPER_ADMIN)
  updateMenuItem(
    @Param('restaurantId') restaurantId: string,
    @Param('itemId') itemId: string,
    @Body() updateMenuItemDto: UpdateMenuItemDto,
  ) {
    return this.restaurantsService.updateMenuItem(
      restaurantId,
      itemId,
      updateMenuItemDto,
    );
  }

  @Delete(':restaurantId/menu/:itemId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  removeMenuItem(
    @Param('restaurantId') restaurantId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.restaurantsService.removeMenuItem(restaurantId, itemId);
  }

  // Endpoints para categorías
  @Get('/categories/all')
  findCategories() {
    return this.restaurantsService.findCategories();
  }

  @Post('/categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.restaurantsService.createCategory(
      createCategoryDto.name,
      createCategoryDto.description,
    );
  }

  @Post('/categories/seed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  seedCategories() {
    return this.restaurantsService.seedCategories();
  }
}
