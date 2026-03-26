import { TranslationReviewStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpsertListingTranslationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(8)
  languageCode!: string;

  @IsString()
  @MaxLength(200)
  title!: string;

  @IsString()
  @MaxLength(20000)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  shortDescription?: string;

  @IsOptional()
  @IsEnum(TranslationReviewStatus)
  reviewStatus?: TranslationReviewStatus;
}

