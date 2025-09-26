import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../orders/entities/order.entity';
import { User } from '../users/entities/user.entity';
import { DeliveriesService } from './deliveries.service';
import {
  DeliveriesController,
  OrderStatusController,
} from './deliveries.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Order, User])],
  controllers: [DeliveriesController, OrderStatusController],
  providers: [DeliveriesService],
  exports: [DeliveriesService],
})
export class DeliveriesModule {}
