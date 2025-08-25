import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { MenuItem } from './entities/menu-item.entity';
import { RestaurantCategory } from './entities/restaurant-category.entity';
import { MenuCategory } from './entities/menu-category.entity';
import { RestaurantsService } from './restaurants.service';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantCategoriesService } from './services/restaurant-categories.service';
import { RestaurantCategoriesController } from './controllers/restaurant-categories.controller';
import { MenuCategoriesService } from './services/menu-categories.service';
import { MenuCategoriesController } from './controllers/menu-categories.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Restaurant,
      MenuItem,
      RestaurantCategory,
      MenuCategory,
    ]),
  ],
  controllers: [
    RestaurantsController,
    RestaurantCategoriesController,
    MenuCategoriesController,
  ],
  providers: [
    RestaurantsService,
    RestaurantCategoriesService,
    MenuCategoriesService,
  ],
  exports: [
    RestaurantsService,
    RestaurantCategoriesService,
    MenuCategoriesService,
  ],
})
export class RestaurantsModule {}
