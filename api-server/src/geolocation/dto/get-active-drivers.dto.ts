import { IsNumber, IsPositive, Min, Max } from 'class-validator';

export class GetActiveDriversDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsNumber()
  @IsPositive()
  @Max(100) // Máximo 100km de radio
  radius: number;
}
