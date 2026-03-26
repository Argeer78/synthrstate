import { IsEmail, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @IsString()
  agencyName!: string;

  @IsString()
  agencySlug!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

