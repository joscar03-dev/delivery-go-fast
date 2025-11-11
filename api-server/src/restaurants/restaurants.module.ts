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
import { MenuOptionGroupsService } from './services/menu-option-groups.service';
import { MenuOptionGroupsController } from './controllers/menu-option-groups.controller';
import { MenuOptionGroup } from './entities/menu-option-group.entity';
import { MenuOption } from './entities/menu-option.entity';
import { RestaurantDeliveryConfig } from '../payments/entities/restaurant-delivery-config.entity';
import { User } from '../users/entities/user.entity';
import { RestaurantDriver } from './entities/restaurant-driver.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Restaurant,
      MenuItem,
      RestaurantCategory,
      MenuCategory,
      MenuOptionGroup,
      MenuOption,
      RestaurantDeliveryConfig,
      User,
      RestaurantDriver,
    ]),
  ],
  controllers: [
    RestaurantsController,
    RestaurantCategoriesController,
    MenuCategoriesController,
    MenuOptionGroupsController,
  ],
  providers: [
    RestaurantsService,
    RestaurantCategoriesService,
    MenuCategoriesService,
    MenuOptionGroupsService,
  ],
  exports: [
    RestaurantsService,
    RestaurantCategoriesService,
    MenuCategoriesService,
    MenuOptionGroupsService,
  ],
})
export class RestaurantsModule {}
