import { IsOptional, IsString, Matches, MaxLength } from "class-validator";

export class UpdateAgencyBasicsDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  email?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string; // placeholder for MVP
}

export class UpdateBrandingDto {
  @IsOptional()
  @IsString()
  @MaxLength(400)
  descriptionShort?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  officeAddress?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#?[0-9a-fA-F]{6}$/, { message: "brandColorHex must be a 6-digit hex color" })
  brandColorHex?: string;
}

export class UpdateAdminProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  titleLabel?: string;
}

