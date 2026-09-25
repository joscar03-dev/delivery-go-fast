import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  Matches,
} from 'class-validator';
import { Role as RoleEnum } from '../../common/enums/role.enum';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'El teléfono debe estar en formato E.164 (ej: +51987654321)',
  })
  phone?: string;

  @IsOptional()
  @IsEnum(RoleEnum, {
    message:
      'Role must be one of: client, driver, restaurant_owner, super_admin',
  })
  role?: RoleEnum;
}
