import {
  IsString,
  IsOptional,
  IsPhoneNumber,
  IsUUID,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class UpdateRestaurantDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsPhoneNumber()
  @IsOptional()
  phone?: string;

  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  longitude?: number;

  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  latitude?: number;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsUUID()
  @IsOptional()
  ownerId?: string;
}
