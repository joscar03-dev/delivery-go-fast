import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Address } from './entities/address.entity';
import { Role } from '../auth/entities/role.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AddressController } from './address.controller';
import { AddressService } from './address.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Address, Role])],
  controllers: [UsersController, AddressController],
  providers: [UsersService, AddressService],
  exports: [UsersService, AddressService], // Exportamos los servicios para que puedan ser usados en otros módulos
})
export class UsersModule {}
