import { IsString, IsNotEmpty, Matches, Length } from 'class-validator';

/**
 * DTO para login con teléfono
 *
 * Flujo:
 * 1. Frontend envía OTP al teléfono usando Firebase
 * 2. Usuario ingresa el código OTP
 * 3. Firebase retorna un idToken (firebaseToken)
 * 4. Frontend envía este DTO al backend
 * 5. Backend verifica el token con Firebase Admin SDK
 */
export class PhoneLoginDto {
  @IsString()
  @IsNotEmpty({ message: 'El número de teléfono es requerido' })
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'El teléfono debe estar en formato E.164 (ejemplo: +51987654321)',
  })
  phone: string;

  @IsString()
  @IsNotEmpty({ message: 'El token de Firebase es requerido' })
  firebaseToken: string;
}

/**
 * DTO para registro con teléfono
 * Extiende PhoneLoginDto y agrega el nombre del usuario
 */
export class PhoneRegisterDto extends PhoneLoginDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @Length(2, 50, {
    message: 'El nombre debe tener entre 2 y 50 caracteres',
  })
  name: string;
}

/**
 * DTO para agregar teléfono a un usuario existente
 * Usado cuando un usuario con email/password quiere agregar su teléfono
 */
export class AddPhoneDto {
  @IsString()
  @IsNotEmpty({ message: 'El número de teléfono es requerido' })
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'El teléfono debe estar en formato E.164 (ejemplo: +51987654321)',
  })
  phone: string;

  @IsString()
  @IsNotEmpty({ message: 'El token de Firebase es requerido' })
  firebaseToken: string;
}
