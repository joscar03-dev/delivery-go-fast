import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Review } from './entities/review.entity';
import { MenuItem } from '../restaurants/entities/menu-item.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { MenuOption } from '../restaurants/entities/menu-option.entity';
import { Address } from '../users/entities/address.entity';
import { User } from '../users/entities/user.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { GeolocationModule } from '../geolocation/geolocation.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Review,
      MenuItem,
      Restaurant,
      MenuOption,
      Address,
      User,
    ]),
    forwardRef(() => GeolocationModule),
    NotificationsModule,
    PaymentsModule,
    AuthModule,
    UsersModule, // ← Agregar para que ActiveUserGuard tenga acceso a UsersService
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
