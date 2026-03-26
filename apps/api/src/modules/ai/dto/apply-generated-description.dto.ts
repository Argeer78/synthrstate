import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class ApplyGeneratedDescriptionDto {
  @IsString()
  @MaxLength(20000)
  descriptionEn!: string;

  @IsString()
  @MaxLength(20000)
  descriptionEl!: string;
}

