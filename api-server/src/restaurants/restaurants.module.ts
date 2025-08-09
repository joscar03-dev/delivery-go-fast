import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { MenuItem } from './entities/menu-item.entity';
import { Category } from './entities/category.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, MenuItem, Category])],
})
export class RestaurantsModule {}
