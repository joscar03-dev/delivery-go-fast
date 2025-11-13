import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GeolocationService } from './geolocation.service';
import { GeolocationController } from './geolocation.controller';
import { DeliveryGateway } from './delivery.gateway';
import { DriverLocation } from './entities/driver-location.entity';
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DriverLocation, User, Order]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>(
            'JWT_ACCESS_TOKEN_EXPIRATION_TIME',
          ),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [GeolocationController],
  providers: [GeolocationService, DeliveryGateway],
  exports: [GeolocationService, DeliveryGateway],
})
export class GeolocationModule {}
