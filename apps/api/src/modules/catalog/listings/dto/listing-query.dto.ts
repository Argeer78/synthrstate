import { ListingStatus, ListingType } from "@prisma/client";
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min, IsNumber } from "class-validator";
import { PaginationDto } from "../../shared/pagination.dto";
import { Transform } from "class-transformer";

export class ListingListQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ListingType)
  listingType?: ListingType;

  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;

  @IsOptional()
  @IsString()
  ownerContactId?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  minPrice?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  maxPrice?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string; // searches title/description

  @IsOptional()
  @IsInt()
  @Min(0)
  bedrooms?: number;
}

