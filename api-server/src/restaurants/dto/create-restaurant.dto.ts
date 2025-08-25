import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsUUID,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class CreateRestaurantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsPhoneNumber()
  phone: string;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsUUID()
  @IsNotEmpty()
  ownerId: string;
}
