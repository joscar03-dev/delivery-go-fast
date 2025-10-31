import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Patch,
  Delete,
} from '@nestjs/common';
import { MenuOptionGroupsService } from '../services/menu-option-groups.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CreateMenuOptionGroupDto } from '../dto/create-menu-option-group.dto';
import { CreateMenuOptionDto } from '../dto/create-menu-option.dto';
import { UpdateMenuOptionDto } from '../dto/update-menu-option.dto';
import { UpdateMenuOptionGroupDto } from '../dto/update-menu-option-group.dto';

@Controller('restaurants/:restaurantId/menu-option-groups')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.RESTAURANT_OWNER)
export class MenuOptionGroupsController {
  constructor(private readonly service: MenuOptionGroupsService) {}

  @Get()
  list(@Param('restaurantId') restaurantId: string) {
    return this.service.list(restaurantId);
  }

  @Post()
  create(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: CreateMenuOptionGroupDto,
  ) {
    return this.service.create(restaurantId, dto);
  }

  @Post(':groupId/options')
  addOption(
    @Param('groupId') groupId: string,
    @Body() dto: CreateMenuOptionDto,
  ) {
    return this.service.addOption(groupId, dto);
  }

  @Patch(':groupId/options/:optionId')
  updateOption(
    @Param('groupId') groupId: string,
    @Param('optionId') optionId: string,
    @Body() dto: UpdateMenuOptionDto,
  ) {
    return this.service.updateOption(groupId, optionId, dto);
  }

  @Delete(':groupId/options/:optionId')
  removeOption(
    @Param('groupId') groupId: string,
    @Param('optionId') optionId: string,
  ) {
    return this.service.removeOption(groupId, optionId);
  }

  @Patch(':groupId')
  update(
    @Param('groupId') groupId: string,
    @Body() dto: UpdateMenuOptionGroupDto,
  ) {
    return this.service.update(groupId, dto);
  }

  @Delete(':groupId')
  remove(@Param('groupId') groupId: string) {
    return this.service.remove(groupId);
  }

  @Post(':groupId/attach/:menuItemId')
  attach(
    @Param('groupId') groupId: string,
    @Param('menuItemId') menuItemId: string,
  ) {
    return this.service.attachGroupToItem(groupId, menuItemId);
  }

  @Post(':groupId/detach/:menuItemId')
  detach(
    @Param('groupId') groupId: string,
    @Param('menuItemId') menuItemId: string,
  ) {
    return this.service.detachGroupFromItem(groupId, menuItemId);
  }
}
