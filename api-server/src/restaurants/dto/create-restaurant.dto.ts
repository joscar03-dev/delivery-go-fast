import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsUUID,
  IsNumber,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { City } from '../../common/enums/city.enum';

export class CreateRestaurantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsPhoneNumber('PE')
  phone: string;

  @IsEnum(City)
  @IsOptional()
  city?: City;

  @IsString()
  @IsOptional()
  imageUrl?: string;

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
  restaurantCategoryId?: string;

  @IsUUID()
  @IsOptional()
  ownerId?: string;
}
