import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsDecimal,
} from 'class-validator';

export class CreateMenuItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDecimal()
  price: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsUUID()
  @IsNotEmpty()
  restaurantId: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;
}
