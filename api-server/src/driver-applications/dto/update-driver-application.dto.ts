import {
  IsOptional,
  IsString,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class UpdateDriverApplicationDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsDateString()
  licenseExpiry?: string;

  @IsOptional()
  @IsString()
  vehiclePlate?: string;

  @IsOptional()
  @IsString()
  vehicleBrand?: string;

  @IsOptional()
  @IsString()
  vehicleModel?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  vehicleYear?: number;

  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @IsOptional()
  @IsString()
  dniPhoto?: string;

  @IsOptional()
  @IsString()
  licenseFrontPhoto?: string;

  @IsOptional()
  @IsString()
  licenseBackPhoto?: string;

  @IsOptional()
  @IsString()
  vehiclePhoto?: string;
}
