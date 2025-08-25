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
import { MenuCategoriesService } from '../services/menu-categories.service';
import { CreateMenuCategoryDto } from '../dto/create-menu-category.dto';
import { UpdateMenuCategoryDto } from '../dto/update-menu-category.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('restaurants/:restaurantId/menu-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MenuCategoriesController {
  constructor(private readonly menuCategoriesService: MenuCategoriesService) {}

  @Post()
  @Roles(Role.RESTAURANT_OWNER, Role.SUPER_ADMIN)
  create(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Body() createMenuCategoryDto: CreateMenuCategoryDto,
  ) {
    return this.menuCategoriesService.create(
      restaurantId,
      createMenuCategoryDto,
    );
  }

  @Get()
  findAll(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.menuCategoriesService.findAll(restaurantId);
  }

  @Get(':id')
  findOne(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.menuCategoriesService.findOne(restaurantId, id);
  }

  @Patch(':id')
  @Roles(Role.RESTAURANT_OWNER, Role.SUPER_ADMIN)
  update(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMenuCategoryDto: UpdateMenuCategoryDto,
  ) {
    return this.menuCategoriesService.update(
      restaurantId,
      id,
      updateMenuCategoryDto,
    );
  }

  @Delete(':id')
  @Roles(Role.RESTAURANT_OWNER, Role.SUPER_ADMIN)
  remove(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.menuCategoriesService.remove(restaurantId, id);
  }

  @Patch(':id/deactivate')
  @Roles(Role.RESTAURANT_OWNER, Role.SUPER_ADMIN)
  deactivate(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.menuCategoriesService.softRemove(restaurantId, id);
  }
}
