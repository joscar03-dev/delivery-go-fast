import { IsNotEmpty, IsString, IsEnum, IsDateString } from 'class-validator';
import { VehicleType } from '../entities/driver-application.entity';

export class CreateDriverApplicationDto {
  @IsNotEmpty()
  @IsString()
  dni: string;

  @IsNotEmpty()
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @IsNotEmpty()
  @IsDateString()
  birthDate: string;
}
