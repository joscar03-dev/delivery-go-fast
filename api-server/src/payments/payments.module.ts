import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentMethod } from './entities/payment-method.entity';
import { OrderPayment } from './entities/order-payment.entity';
import { RestaurantDeliveryConfig } from './entities/restaurant-delivery-config.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentMethod,
      OrderPayment,
      RestaurantDeliveryConfig,
    ]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
