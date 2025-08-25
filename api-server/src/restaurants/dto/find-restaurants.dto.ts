import { IsOptional, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class FindRestaurantsDto {
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Transform(({ value }) => parseFloat(value))
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Transform(({ value }) => parseFloat(value))
  longitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  radius?: number; // Radio en kilómetros
}
