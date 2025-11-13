import { IsNumber, IsNotEmpty, Min, Max } from 'class-validator';

export class CheckCoverageDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;
}

export class CoverageResponse {
  isInCoverage: boolean;
  message: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}
