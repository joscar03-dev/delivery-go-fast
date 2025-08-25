import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { MenuItem } from './entities/menu-item.entity';
import { Category } from './entities/category.entity';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { FindRestaurantsDto } from './dto/find-restaurants.dto';
import { defaultCategories } from '../common/seeds/categories.seed';
import { GeospatialQueryBuilder } from '../common/utils/geospatial.util';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    @InjectRepository(MenuItem)
    private readonly menuItemRepository: Repository<MenuItem>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  // CRUD para Restaurantes
  async create(createRestaurantDto: CreateRestaurantDto): Promise<Restaurant> {
    const { longitude, latitude, categoryId, ownerId, ...restaurantData } =
      createRestaurantDto;

    const restaurant = this.restaurantRepository.create({
      ...restaurantData,
      location: GeospatialQueryBuilder.formatAsPostGISPoint(
        latitude,
        longitude,
      ),
      category: categoryId ? { id: categoryId } : null,
      owner: { id: ownerId },
    });

    return await this.restaurantRepository.save(restaurant);
  }

  async findAll(): Promise<Restaurant[]> {
    return await this.restaurantRepository.find({
      relations: ['category', 'owner'],
    });
  }

  async findNearby(query: FindRestaurantsDto): Promise<Restaurant[]> {
    const { latitude, longitude, radius = 10 } = query;

    if (!latitude || !longitude) {
      return this.findAll();
    }

    // Validar coordenadas
    if (!GeospatialQueryBuilder.validateCoordinates(latitude, longitude)) {
      throw new Error('Coordenadas inválidas');
    }

    // Usar el query builder optimizado
    const restaurants = await GeospatialQueryBuilder.findNearbyRestaurants(
      this.restaurantRepository,
      latitude,
      longitude,
      radius,
    ).getMany();

    return restaurants;
  }

  async findOne(id: string): Promise<Restaurant> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id },
      relations: ['category', 'owner', 'menuItems'],
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${id} not found`);
    }

    return restaurant;
  }

  async update(
    id: string,
    updateRestaurantDto: UpdateRestaurantDto,
  ): Promise<Restaurant> {
    const { longitude, latitude, categoryId, ownerId, ...restaurantData } =
      updateRestaurantDto;

    await this.restaurantRepository.save({
      id,
      ...restaurantData,
      ...(longitude &&
        latitude && {
          location: GeospatialQueryBuilder.formatAsPostGISPoint(
            latitude,
            longitude,
          ),
        }),
      ...(categoryId && { category: { id: categoryId } }),
      ...(ownerId && { owner: { id: ownerId } }),
    });

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const restaurant = await this.findOne(id);
    await this.restaurantRepository.remove(restaurant);
  }

  // CRUD para Menú Items
  async createMenuItem(
    createMenuItemDto: CreateMenuItemDto,
  ): Promise<MenuItem> {
    const { restaurantId, categoryId, ...menuItemData } = createMenuItemDto;

    const menuItem = this.menuItemRepository.create({
      ...menuItemData,
      restaurant: { id: restaurantId },
      category: categoryId ? { id: categoryId } : null,
    });

    return await this.menuItemRepository.save(menuItem);
  }

  async findMenuItems(restaurantId: string): Promise<MenuItem[]> {
    const restaurant = await this.findOne(restaurantId);
    return await this.menuItemRepository.find({
      where: { restaurant: { id: restaurant.id } },
      relations: ['category'],
    });
  }

  async findMenuItem(restaurantId: string, itemId: string): Promise<MenuItem> {
    const menuItem = await this.menuItemRepository.findOne({
      where: { id: itemId, restaurant: { id: restaurantId } },
      relations: ['restaurant', 'category'],
    });

    if (!menuItem) {
      throw new NotFoundException(
        `Menu item with ID ${itemId} not found in restaurant ${restaurantId}`,
      );
    }

    return menuItem;
  }

  async updateMenuItem(
    restaurantId: string,
    itemId: string,
    updateMenuItemDto: UpdateMenuItemDto,
  ): Promise<MenuItem> {
    const { categoryId, ...menuItemData } = updateMenuItemDto;

    await this.findMenuItem(restaurantId, itemId);

    await this.menuItemRepository.update(itemId, {
      ...menuItemData,
      ...(categoryId && { category: { id: categoryId } }),
    });

    return this.findMenuItem(restaurantId, itemId);
  }

  async removeMenuItem(restaurantId: string, itemId: string): Promise<void> {
    const menuItem = await this.findMenuItem(restaurantId, itemId);
    await this.menuItemRepository.remove(menuItem);
  }

  // Métodos para categorías
  async findCategories(): Promise<Category[]> {
    return await this.categoryRepository.find();
  }

  async createCategory(name: string, description?: string): Promise<Category> {
    const category = this.categoryRepository.create({ name, description });
    return await this.categoryRepository.save(category);
  }

  async seedCategories(): Promise<Category[]> {
    const existingCategories = await this.categoryRepository.find();

    if (existingCategories.length > 0) {
      return existingCategories;
    }

    const categories = await Promise.all(
      defaultCategories.map(async (categoryData) => {
        const category = this.categoryRepository.create(categoryData);
        return await this.categoryRepository.save(category);
      }),
    );

    return categories;
  }
}
