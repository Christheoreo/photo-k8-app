import { Transform } from 'class-transformer';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @Transform(({ value }) => value.toLowerCase().trim())
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
