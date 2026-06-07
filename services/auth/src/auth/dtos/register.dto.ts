import { Transform } from 'class-transformer';
import { IsEmail, IsStrongPassword } from 'class-validator';

export class RegisterDto {
  @Transform(({ value }) => value.toLowerCase().trim())
  @IsEmail()
  email!: string;

  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password!: string;
}
