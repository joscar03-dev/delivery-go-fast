import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverApplicationsService } from './driver-applications.service';
import { DriverApplicationsController } from './driver-applications.controller';
import { DriverApplication } from './entities/driver-application.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([DriverApplication]), UsersModule],
  controllers: [DriverApplicationsController],
  providers: [DriverApplicationsService],
  exports: [DriverApplicationsService],
})
export class DriverApplicationsModule {}
