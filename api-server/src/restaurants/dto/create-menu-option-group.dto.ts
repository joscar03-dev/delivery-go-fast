import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';

export class CreateMenuOptionGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  minSelect?: number = 0;

  @IsInt()
  @Min(0)
  @IsOptional()
  maxSelect?: number = 0;

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean = false;
}
