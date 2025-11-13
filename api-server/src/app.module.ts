import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { OrdersModule } from './orders/orders.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { GeolocationModule } from './geolocation/geolocation.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { DriverApplicationsModule } from './driver-applications/driver-applications.module';
import { RestaurantApplicationsModule } from './restaurant-applications/restaurant-applications.module';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // Ruta al archivo de configuración
      validationSchema: Joi.object({
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(5432),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_ACCESS_TOKEN_EXPIRATION_TIME: Joi.string().default('1h'),
        JWT_REFRESH_TOKEN_EXPIRATION_TIME: Joi.string().default('7d'),
        BCRYPT_SALT_ROUNDS: Joi.number().default(10),
      }),
    }),

    // Sistema de eventos para notificaciones automáticas
    EventEmitterModule.forRoot({
      // Usar wildcards para escuchar patrones de eventos
      wildcard: false,
      // Separador para eventos anidados
      delimiter: '.',
      // Cantidad máxima de listeners por evento
      maxListeners: 10,
      // Log de warnings si se excede maxListeners
      verboseMemoryLeak: true,
      // Modo async (no bloquear la ejecución principal)
      ignoreErrors: false,
    }),

    // Tareas programadas (cron jobs) para limpieza automática
    ScheduleModule.forRoot(),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: +configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        // Configuración de zona horaria para Lima, Perú (UTC-5)
        timezone: 'America/Lima',
        // En producción usamos migraciones; activar bootstrap puntual con DB_BOOTSTRAP=true
        synchronize:
          process.env.NODE_ENV !== 'production' ||
          process.env.DB_BOOTSTRAP === 'true',
      }),
    }),
    AuthModule,
    UsersModule,
    RestaurantsModule,
    OrdersModule,
    DeliveriesModule,
    GeolocationModule,
    NotificationsModule,
    PaymentsModule,
    DriverApplicationsModule,
    RestaurantApplicationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
