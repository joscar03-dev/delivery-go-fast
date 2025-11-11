import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  IsUUID,
  IsEnum,
  MaxLength,
  MinLength,
} from 'class-validator';
import { City } from '../../common/enums/city.enum';

export class CreateRestaurantApplicationDto {
  @IsNotEmpty({ message: 'El nombre del negocio es obligatorio' })
  @IsString()
  @MaxLength(255)
  businessName: string;

  @IsNotEmpty({ message: 'El teléfono del negocio es obligatorio' })
  @IsString()
  @MinLength(7)
  @MaxLength(20)
  businessPhone: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email debe ser válido' })
  @MaxLength(100)
  businessEmail?: string;

  @IsNotEmpty({ message: 'La dirección es obligatoria' })
  @IsString()
  address: string;

  @IsNotEmpty({ message: 'La categoría es obligatoria' })
  @IsUUID('4', { message: 'La categoría debe ser un UUID válido' })
  categoryId: string;

  @IsNotEmpty({ message: 'La ciudad es obligatoria' })
  @IsEnum(City, { message: 'La ciudad debe ser válida' })
  city: City;

  @IsNotEmpty({ message: 'El nombre del representante es obligatorio' })
  @IsString()
  @MaxLength(255)
  ownerName: string;

  @IsNotEmpty({ message: 'El DNI del representante es obligatorio' })
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  ownerDni: string;

  @IsOptional()
  @IsString()
  additionalComments?: string;
}
