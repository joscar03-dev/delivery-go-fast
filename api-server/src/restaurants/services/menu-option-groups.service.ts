import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuOptionGroup } from '../entities/menu-option-group.entity';
import { MenuOption } from '../entities/menu-option.entity';
import { Restaurant } from '../entities/restaurant.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { CreateMenuOptionGroupDto } from '../dto/create-menu-option-group.dto';
import { CreateMenuOptionDto } from '../dto/create-menu-option.dto';
import { UpdateMenuOptionGroupDto } from '../dto/update-menu-option-group.dto';
import { UpdateMenuOptionDto } from '../dto/update-menu-option.dto';

@Injectable()
export class MenuOptionGroupsService {
  constructor(
    @InjectRepository(MenuOptionGroup)
    private readonly groupRepo: Repository<MenuOptionGroup>,
    @InjectRepository(MenuOption)
    private readonly optionRepo: Repository<MenuOption>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepo: Repository<Restaurant>,
    @InjectRepository(MenuItem)
    private readonly menuItemRepo: Repository<MenuItem>,
  ) {}

  async list(restaurantId: string): Promise<MenuOptionGroup[]> {
    return this.groupRepo.find({
      where: { restaurant: { id: restaurantId } },
      relations: ['options', 'menuItems'],
      order: { name: 'ASC' },
    });
  }

  async create(
    restaurantId: string,
    dto: CreateMenuOptionGroupDto,
  ): Promise<MenuOptionGroup> {
    const r = await this.restaurantRepo.findOne({
      where: { id: restaurantId },
    });
    if (!r) throw new NotFoundException('Restaurant not found');
    const group = this.groupRepo.create({
      ...dto,
      restaurant: { id: restaurantId },
    });
    return this.groupRepo.save(group);
  }

  async addOption(
    groupId: string,
    dto: CreateMenuOptionDto,
  ): Promise<MenuOption> {
    const g = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!g) throw new NotFoundException('Option group not found');
    const opt = this.optionRepo.create({ ...dto, group: { id: groupId } });
    return this.optionRepo.save(opt);
  }

  async attachGroupToItem(groupId: string, menuItemId: string): Promise<void> {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Option group not found');
    const item = await this.menuItemRepo.findOne({
      where: { id: menuItemId },
      relations: ['category', 'restaurant'],
    });
    if (!item) throw new NotFoundException('Menu item not found');
    // Cargar grupos actuales
    const fullGroup = await this.groupRepo.findOne({
      where: { id: groupId },
      relations: ['menuItems'],
    });
    fullGroup.menuItems = Array.from(
      new Set([...(fullGroup.menuItems || []), item]),
    );
    await this.groupRepo.save(fullGroup);
  }

  async detachGroupFromItem(
    groupId: string,
    menuItemId: string,
  ): Promise<void> {
    const fullGroup = await this.groupRepo.findOne({
      where: { id: groupId },
      relations: ['menuItems'],
    });
    if (!fullGroup) throw new NotFoundException('Option group not found');
    fullGroup.menuItems = (fullGroup.menuItems || []).filter(
      (mi) => mi.id !== menuItemId,
    );
    await this.groupRepo.save(fullGroup);
  }

  async update(
    groupId: string,
    dto: UpdateMenuOptionGroupDto,
  ): Promise<MenuOptionGroup> {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Option group not found');
    Object.assign(group, dto);
    return this.groupRepo.save(group);
  }

  async remove(groupId: string): Promise<void> {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Option group not found');
    await this.groupRepo.remove(group);
  }

  async updateOption(
    groupId: string,
    optionId: string,
    dto: UpdateMenuOptionDto,
  ): Promise<MenuOption> {
    const opt = await this.optionRepo.findOne({
      where: { id: optionId },
      relations: ['group'],
    });
    if (!opt) throw new NotFoundException('Option not found');
    if (opt.group?.id !== groupId) {
      throw new ForbiddenException('Option does not belong to group');
    }
    Object.assign(opt, dto);
    return this.optionRepo.save(opt);
  }

  async removeOption(groupId: string, optionId: string): Promise<void> {
    const opt = await this.optionRepo.findOne({
      where: { id: optionId },
      relations: ['group'],
    });
    if (!opt) throw new NotFoundException('Option not found');
    if (opt.group?.id !== groupId) {
      throw new ForbiddenException('Option does not belong to group');
    }
    await this.optionRepo.remove(opt);
  }
}
