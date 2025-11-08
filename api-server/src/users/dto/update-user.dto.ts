import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  IsEnum,
  Matches,
} from 'class-validator';
import { Role as RoleEnum } from '../../common/enums/role.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{9}$/, {
    message: 'El teléfono debe tener exactamente 9 dígitos',
  })
  phone?: string;

  @IsOptional()
  @IsEnum(RoleEnum)
  role?: RoleEnum;
}
