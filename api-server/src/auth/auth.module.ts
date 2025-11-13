import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from 'src/users/users.module';
import { Role } from './entities/role.entity';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './guards/roles.guard';
import { ActiveUserGuard } from './guards/active-user.guard';
import { OtpService } from './services/otp.service';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([Role]),
    ConfigModule.forRoot(),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    RolesGuard,
    ActiveUserGuard,
    OtpService,
  ],
  exports: [ActiveUserGuard],
})
export class AuthModule {}
