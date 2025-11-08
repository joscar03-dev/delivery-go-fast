import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApplicationStatus } from '../entities/driver-application.entity';

export class UpdateApplicationStatusDto {
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
