import { EnergyClass } from "@prisma/client";
import { IsArray, IsNumber, IsOptional, IsString, IsEnum, Max, Min, MaxLength } from "class-validator";

export class UpdatePropertyDto {
  @IsOptional()
  @IsString()
  ownerContactId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  area?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsEnum(EnergyClass)
  energyClass?: EnergyClass;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];
}

