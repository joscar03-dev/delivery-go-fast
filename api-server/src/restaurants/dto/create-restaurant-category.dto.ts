import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateRestaurantCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
