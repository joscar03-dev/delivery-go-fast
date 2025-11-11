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
import { RestaurantDeliveryConfig } from '../payments/entities/restaurant-delivery-config.entity';
import { User } from '../users/entities/user.entity';
import { RestaurantDriver } from './entities/restaurant-driver.entity';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { FindRestaurantsDto } from './dto/find-restaurants.dto';
import { defaultCategories } from '../common/seeds/categories.seed';
import { GeospatialQueryBuilder } from '../common/utils/geospatial.util';
import { Role } from '../common/enums/role.enum';
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
    @InjectRepository(RestaurantDeliveryConfig)
    private readonly deliveryConfigRepository: Repository<RestaurantDeliveryConfig>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RestaurantDriver)
    private readonly restaurantDriverRepository: Repository<RestaurantDriver>,
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
      relations: [
        'category',
        'owner',
        'menuItems',
        'menuItems.category', // Cargar también la categoría de cada menu item
        'menuCategories',
      ],
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
      where: { restaurant: { id: restaurant.id }, isActive: true },
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

    // En lugar de eliminar el ítem, marcarlo como inactivo
    // Esto preserva la integridad referencial con pedidos existentes
    menuItem.isActive = false;
    await this.menuItemRepository.save(menuItem);
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

  // Métodos para configuración de delivery
  async getDeliveryConfig(
    restaurantId: string,
  ): Promise<RestaurantDeliveryConfig> {
    const config = await this.deliveryConfigRepository.findOne({
      where: { restaurantId },
    });

    if (!config) {
      throw new NotFoundException(
        `No se encontró configuración de delivery para el restaurante ${restaurantId}`,
      );
    }

    return config;
  }

  async updateDeliveryConfig(
    restaurantId: string,
    updateDto: Partial<RestaurantDeliveryConfig>,
  ): Promise<RestaurantDeliveryConfig> {
    let config = await this.deliveryConfigRepository.findOne({
      where: { restaurantId },
    });

    if (!config) {
      // Crear configuración si no existe
      config = this.deliveryConfigRepository.create({
        restaurantId,
        ...updateDto,
      });
    } else {
      // Actualizar configuración existente
      Object.assign(config, updateDto);
    }

    return await this.deliveryConfigRepository.save(config);
  }

  // Método para obtener restaurantes por dueño
  async findByOwner(ownerId: string): Promise<Restaurant[]> {
    console.log('🔍 Buscando restaurantes para owner ID:', ownerId);

    const restaurants = await this.restaurantRepository.find({
      where: { owner: { id: ownerId } },
      relations: ['category', 'owner'],
      order: { createdAt: 'DESC' },
    });

    console.log('📋 Restaurantes encontrados:', restaurants.length);
    restaurants.forEach((r) => {
      console.log(`  - ${r.name} (owner_id: ${r.owner?.id})`);
    });

    return restaurants;
  }

  // Método para obtener drivers del restaurante (para delivery propio)
  async getRestaurantDrivers(restaurantId: string): Promise<User[]> {
    console.log('🚗 Buscando drivers para restaurante ID:', restaurantId);

    // Buscar drivers asignados al restaurante en la tabla pivot
    const restaurantDrivers = await this.restaurantDriverRepository.find({
      where: {
        restaurantId,
        isActive: true,
      },
      relations: ['driver', 'driver.role'],
    });

    const drivers = restaurantDrivers.map((rd) => rd.driver);

    console.log(
      '👥 Drivers encontrados para este restaurante:',
      drivers.length,
    );

    return drivers;
  }

  // Método para asignar un driver a un restaurante
  async assignDriverToRestaurant(
    restaurantId: string,
    driverId: string,
  ): Promise<RestaurantDriver> {
    // Verificar si ya existe la relación
    const existing = await this.restaurantDriverRepository.findOne({
      where: { restaurantId, driverId },
    });

    if (existing) {
      // Si existe pero está inactivo, activarlo
      if (!existing.isActive) {
        existing.isActive = true;
        return await this.restaurantDriverRepository.save(existing);
      }
      return existing;
    }

    // Crear nueva relación
    const restaurantDriver = this.restaurantDriverRepository.create({
      restaurantId,
      driverId,
      isActive: true,
    });

    return await this.restaurantDriverRepository.save(restaurantDriver);
  }

  // Método para remover un driver de un restaurante
  async removeDriverFromRestaurant(
    restaurantId: string,
    driverId: string,
  ): Promise<void> {
    const restaurantDriver = await this.restaurantDriverRepository.findOne({
      where: { restaurantId, driverId },
    });

    if (restaurantDriver) {
      restaurantDriver.isActive = false;
      await this.restaurantDriverRepository.save(restaurantDriver);
    }
  }
}
