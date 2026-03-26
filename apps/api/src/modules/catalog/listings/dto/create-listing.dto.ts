import { ListingStatus, ListingType } from "@prisma/client";
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class CreateListingDto {
  @IsString()
  propertyId!: string;

  @IsEnum(ListingType)
  listingType!: ListingType;

  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;

  @IsString()
  @MaxLength(200)
  title!: string;

  @IsString()
  @MaxLength(20000)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  descriptionEl?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  bedrooms?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bathrooms?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  sqm?: number;
}

