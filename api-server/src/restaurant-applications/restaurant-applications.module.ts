import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantApplicationsService } from './restaurant-applications.service';
import {
  RestaurantApplicationsController,
  AdminRestaurantApplicationsController,
} from './restaurant-applications.controller';
import { RestaurantApplication } from './entities/restaurant-application.entity';
import { UsersModule } from '../users/users.module';
import { RestaurantsModule } from '../restaurants/restaurants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RestaurantApplication]),
    UsersModule,
    RestaurantsModule,
  ],
  controllers: [
    RestaurantApplicationsController,
    AdminRestaurantApplicationsController,
  ],
  providers: [RestaurantApplicationsService],
  exports: [RestaurantApplicationsService],
})
export class RestaurantApplicationsModule {}
