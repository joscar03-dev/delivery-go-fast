import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { MenuItem } from './entities/menu-item.entity';
import { RestaurantCategory } from './entities/restaurant-category.entity';
import { MenuCategory } from './entities/menu-category.entity';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { FindRestaurantsDto } from './dto/find-restaurants.dto';
import { defaultCategories } from '../common/seeds/categories.seed';
import { GeospatialQueryBuilder } from '../common/utils/geospatial.util';
import { Point } from 'geojson';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    @InjectRepository(MenuItem)
    private readonly menuItemRepository: Repository<MenuItem>,
    @InjectRepository(RestaurantCategory)
    private readonly restaurantCategoryRepository: Repository<RestaurantCategory>,
    @InjectRepository(MenuCategory)
    private readonly menuCategoryRepository: Repository<MenuCategory>,
  ) {}

  // CRUD para Restaurantes
  async create(createRestaurantDto: CreateRestaurantDto): Promise<Restaurant> {
    const {
      longitude,
      latitude,
      restaurantCategoryId,
      ownerId,
      ...restaurantData
    } = createRestaurantDto;

    // Validar que ownerId esté presente
    if (!ownerId) {
      throw new BadRequestException(
        'ownerId es requerido para crear un restaurante',
      );
    }

    // 👇 AQUÍ TRANSFORMAMOS LOS DATOS 👇
    const locationObject: Point = {
      type: 'Point',
      coordinates: [longitude, latitude], // Orden: [longitud, latitud]
    };

    // Buscar la categoría de restaurante si se proporciona
    let category;
    if (restaurantCategoryId) {
      category = await this.restaurantCategoryRepository.findOne({
        where: { id: restaurantCategoryId },
      });
      if (!category) {
        throw new NotFoundException(
          `Categoría de restaurante con ID ${restaurantCategoryId} no encontrada`,
        );
      }
    }

    const restaurant = this.restaurantRepository.create({
      ...restaurantData,
      location: locationObject, // Asignamos el objeto transformado
      category,
      owner: { id: ownerId },
    });

    return this.restaurantRepository.save(restaurant);
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
    const {
      longitude,
      latitude,
      restaurantCategoryId,
      ownerId,
      ...restaurantData
    } = updateRestaurantDto;

    // Buscar la categoría de restaurante si se proporciona
    let category;
    if (restaurantCategoryId) {
      category = await this.restaurantCategoryRepository.findOne({
        where: { id: restaurantCategoryId },
      });
      if (!category) {
        throw new NotFoundException(
          `Categoría de restaurante con ID ${restaurantCategoryId} no encontrada`,
        );
      }
    }

    // El método .preload() es más seguro para actualizaciones.
    // Carga la entidad existente y luego fusiona los nuevos datos.
    const restaurantToUpdate = await this.restaurantRepository.preload({
      id,
      ...restaurantData,
      // 👇 --- INICIO DE LA CORRECCIÓN --- 👇
      ...(longitude &&
        latitude && {
          // Creamos el objeto Point directamente en lugar de usar el builder
          location: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
        }),
      // 👆 --- FIN DE LA CORRECCIÓN --- 👆
      ...(category && { category }),
      ...(ownerId && { owner: { id: ownerId } }),
    });

    // Si el restaurante con ese ID no existe, preload devuelve undefined.
    if (!restaurantToUpdate) {
      throw new NotFoundException(`Restaurante con ID "${id}" no encontrado`);
    }

    return this.restaurantRepository.save(restaurantToUpdate);
  }

  async remove(id: string): Promise<void> {
    const restaurant = await this.findOne(id);
    await this.restaurantRepository.remove(restaurant);
  }

  // CRUD para Menú Items
  async createMenuItem(
    createMenuItemDto: CreateMenuItemDto,
  ): Promise<MenuItem> {
    const { restaurantId, menuCategoryId, ...menuItemData } = createMenuItemDto;

    // Buscar la categoría de menú si se proporciona
    let category;
    if (menuCategoryId) {
      category = await this.menuCategoryRepository.findOne({
        where: { id: menuCategoryId },
      });
      if (!category) {
        throw new NotFoundException(
          `Categoría de menú con ID ${menuCategoryId} no encontrada`,
        );
      }
    }

    const menuItem = this.menuItemRepository.create({
      ...menuItemData,
      restaurant: { id: restaurantId },
      category,
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
    const { menuCategoryId, ...menuItemData } = updateMenuItemDto;

    await this.findMenuItem(restaurantId, itemId);

    // Buscar la categoría de menú si se proporciona
    let category;
    if (menuCategoryId) {
      category = await this.menuCategoryRepository.findOne({
        where: { id: menuCategoryId },
      });
      if (!category) {
        throw new NotFoundException(
          `Categoría de menú con ID ${menuCategoryId} no encontrada`,
        );
      }
    }

    await this.menuItemRepository.update(itemId, {
      ...menuItemData,
      ...(category && { category }),
    });

    return this.findMenuItem(restaurantId, itemId);
  }

  async removeMenuItem(restaurantId: string, itemId: string): Promise<void> {
    const menuItem = await this.findMenuItem(restaurantId, itemId);
    await this.menuItemRepository.remove(menuItem);
  }

  // Métodos para categorías de restaurante
  async findRestaurantCategories(): Promise<RestaurantCategory[]> {
    return await this.restaurantCategoryRepository.find();
  }

  async createRestaurantCategory(
    name: string,
    description?: string,
    icon?: string,
  ): Promise<RestaurantCategory> {
    const category = this.restaurantCategoryRepository.create({
      name,
      description,
      icon,
    });
    return await this.restaurantCategoryRepository.save(category);
  }

  async seedRestaurantCategories(): Promise<RestaurantCategory[]> {
    const existingCategories = await this.restaurantCategoryRepository.find();

    if (existingCategories.length > 0) {
      return existingCategories;
    }

    const categories = await Promise.all(
      defaultCategories.map(async (categoryData) => {
        const category = this.restaurantCategoryRepository.create(categoryData);
        return await this.restaurantCategoryRepository.save(category);
      }),
    );

    return categories;
  }
}
