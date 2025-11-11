import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  Matches,
  ValidateIf,
} from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class RegisterAuthDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @ValidateIf((o) => !o.phone)
  @IsNotEmpty({ message: 'El email es requerido si no envías teléfono' })
  @IsEmail({}, { message: 'Email inválido' })
  @IsOptional()
  email?: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ValidateIf((o) => !o.email)
  @IsNotEmpty({ message: 'El teléfono es requerido si no envías email' })
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'El teléfono debe estar en formato E.164 (ej: +51987654321)',
  })
  @IsOptional()
  phone?: string;

  @IsOptional()
  @IsEnum(Role, {
    message:
      'Role must be one of: client, driver, restaurant_owner, super_admin',
  })
  role?: Role;
}
