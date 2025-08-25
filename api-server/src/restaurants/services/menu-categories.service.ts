import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuCategory } from '../entities/menu-category.entity';
import { Restaurant } from '../entities/restaurant.entity';
import { CreateMenuCategoryDto } from '../dto/create-menu-category.dto';
import { UpdateMenuCategoryDto } from '../dto/update-menu-category.dto';

@Injectable()
export class MenuCategoriesService {
  constructor(
    @InjectRepository(MenuCategory)
    private readonly menuCategoryRepository: Repository<MenuCategory>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
  ) {}

  async create(
    restaurantId: string,
    createMenuCategoryDto: CreateMenuCategoryDto,
  ): Promise<MenuCategory> {
    // Verificar que el restaurante existe
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException(
        `Restaurante con ID "${restaurantId}" no encontrado`,
      );
    }

    const category = this.menuCategoryRepository.create({
      ...createMenuCategoryDto,
      restaurant,
    });

    return await this.menuCategoryRepository.save(category);
  }

  async findAll(restaurantId: string): Promise<MenuCategory[]> {
    // Verificar que el restaurante existe
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException(
        `Restaurante con ID "${restaurantId}" no encontrado`,
      );
    }

    return await this.menuCategoryRepository.find({
      where: { restaurant: { id: restaurantId }, isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
      relations: ['menuItems'],
    });
  }

  async findOne(restaurantId: string, id: string): Promise<MenuCategory> {
    const category = await this.menuCategoryRepository.findOne({
      where: { id, restaurant: { id: restaurantId } },
      relations: ['restaurant', 'menuItems'],
    });

    if (!category) {
      throw new NotFoundException(
        `Categoría de menú con ID "${id}" no encontrada en el restaurante "${restaurantId}"`,
      );
    }

    return category;
  }

  async update(
    restaurantId: string,
    id: string,
    updateMenuCategoryDto: UpdateMenuCategoryDto,
  ): Promise<MenuCategory> {
    const category = await this.findOne(restaurantId, id);

    Object.assign(category, updateMenuCategoryDto);

    return await this.menuCategoryRepository.save(category);
  }

  async remove(restaurantId: string, id: string): Promise<void> {
    const category = await this.findOne(restaurantId, id);
    await this.menuCategoryRepository.remove(category);
  }

  async softRemove(restaurantId: string, id: string): Promise<MenuCategory> {
    const category = await this.findOne(restaurantId, id);
    category.isActive = false;
    return await this.menuCategoryRepository.save(category);
  }
}
