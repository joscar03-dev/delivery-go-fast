import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { RestaurantCategoriesService } from '../services/restaurant-categories.service';
import { CreateRestaurantCategoryDto } from '../dto/create-restaurant-category.dto';
import { UpdateRestaurantCategoryDto } from '../dto/update-restaurant-category.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('restaurant-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RestaurantCategoriesController {
  constructor(
    private readonly restaurantCategoriesService: RestaurantCategoriesService,
  ) {}

  @Post()
  @Roles(Role.SUPER_ADMIN)
  create(@Body() createRestaurantCategoryDto: CreateRestaurantCategoryDto) {
    return this.restaurantCategoriesService.create(createRestaurantCategoryDto);
  }

  @Get()
  findAll() {
    return this.restaurantCategoriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.restaurantCategoriesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRestaurantCategoryDto: UpdateRestaurantCategoryDto,
  ) {
    return this.restaurantCategoriesService.update(
      id,
      updateRestaurantCategoryDto,
    );
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.restaurantCategoriesService.remove(id);
  }

  @Patch(':id/deactivate')
  @Roles(Role.SUPER_ADMIN)
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.restaurantCategoriesService.softRemove(id);
  }
}
