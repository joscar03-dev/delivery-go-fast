import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateMenuOptionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  extraPrice?: number = 0;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
