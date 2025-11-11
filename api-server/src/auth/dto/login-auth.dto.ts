import { IsNotEmpty, IsString, Matches } from 'class-validator';

/**
 * Login con identificador flexible: email o teléfono en formato E.164
 * - identifier: puede ser un email válido o un teléfono +[código][número]
 *   Se valida con una expresión que acepta ambos casos.
 */
export class LoginAuthDto {
  @IsNotEmpty({ message: 'El identificador es requerido' })
  @IsString()
  @Matches(
    // Email básico o E.164 (+[1-9][...])
    /(^[^\s@]+@[^\s@]+\.[^\s@]+$)|(^\+[1-9]\d{1,14}$)/,
    {
      message:
        'El identificador debe ser un email válido o un teléfono en formato E.164 (ej: +51987654321)',
    },
  )
  identifier: string;

  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @IsString()
  password: string;
}
