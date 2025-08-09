import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
export class RegisterAuthDto {
  @IsNotEmpty() @IsString() name: string;
  @IsNotEmpty() @IsEmail() email: string;
  @IsNotEmpty() @IsString() @MinLength(6) password: string;
}
