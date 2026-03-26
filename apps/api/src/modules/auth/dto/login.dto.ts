import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  // for users with multiple agency memberships (future-proof)
  @IsOptional()
  @IsString()
  agencySlug?: string;
}

