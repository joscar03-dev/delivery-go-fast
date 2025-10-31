import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Review } from './entities/review.entity';
import { MenuItem } from '../restaurants/entities/menu-item.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { MenuOption } from '../restaurants/entities/menu-option.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Review,
      MenuItem,
      Restaurant,
      MenuOption,
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
