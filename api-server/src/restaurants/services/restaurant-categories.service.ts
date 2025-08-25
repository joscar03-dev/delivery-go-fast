import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RestaurantCategory } from '../entities/restaurant-category.entity';
import { CreateRestaurantCategoryDto } from '../dto/create-restaurant-category.dto';
import { UpdateRestaurantCategoryDto } from '../dto/update-restaurant-category.dto';

@Injectable()
export class RestaurantCategoriesService {
  constructor(
    @InjectRepository(RestaurantCategory)
    private readonly restaurantCategoryRepository: Repository<RestaurantCategory>,
  ) {}

  async create(
    createRestaurantCategoryDto: CreateRestaurantCategoryDto,
  ): Promise<RestaurantCategory> {
    const category = this.restaurantCategoryRepository.create(
      createRestaurantCategoryDto,
    );
    return await this.restaurantCategoryRepository.save(category);
  }

  async findAll(): Promise<RestaurantCategory[]> {
    return await this.restaurantCategoryRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<RestaurantCategory> {
    const category = await this.restaurantCategoryRepository.findOne({
      where: { id },
      relations: ['restaurants'],
    });

    if (!category) {
      throw new NotFoundException(
        `Categoría de restaurante con ID "${id}" no encontrada`,
      );
    }

    return category;
  }

  async update(
    id: string,
    updateRestaurantCategoryDto: UpdateRestaurantCategoryDto,
  ): Promise<RestaurantCategory> {
    const category = await this.restaurantCategoryRepository.preload({
      id,
      ...updateRestaurantCategoryDto,
    });

    if (!category) {
      throw new NotFoundException(
        `Categoría de restaurante con ID "${id}" no encontrada`,
      );
    }

    return await this.restaurantCategoryRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    await this.restaurantCategoryRepository.remove(category);
  }

  async softRemove(id: string): Promise<RestaurantCategory> {
    const category = await this.findOne(id);
    category.isActive = false;
    return await this.restaurantCategoryRepository.save(category);
  }
}
