import { IsArray, IsBoolean, IsOptional, IsString, MaxLength, MinLength, ArrayMinSize } from "class-validator";

export class TranslateListingDto {
  @IsString()
  @MinLength(2)
  @MaxLength(8)
  targetLanguage!: string;

  @IsOptional()
  @IsBoolean()
  overwrite?: boolean;
}

export class BulkTranslateListingsDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  listingIds?: string[];

  @IsString()
  @MinLength(2)
  @MaxLength(8)
  targetLanguage!: string;

  @IsOptional()
  @IsBoolean()
  overwrite?: boolean;

  @IsOptional()
  @IsBoolean()
  allEligible?: boolean;
}

