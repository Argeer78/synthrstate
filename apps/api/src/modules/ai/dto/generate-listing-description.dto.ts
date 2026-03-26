import { AiTone } from "@prisma/client";
import { IsEnum, IsObject, IsOptional, IsString, MaxLength, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class ListingOverrideDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  descriptionEn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  descriptionEl?: string;
}

export class GenerateListingDescriptionDto {
  @IsEnum(AiTone)
  tone!: AiTone;

  // Optional: if supplied, we use these fields in the prompt.
  // If not supplied, we load from DB based on listingId.
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ListingOverrideDto)
  listingOverride?: ListingOverrideDto;
}

