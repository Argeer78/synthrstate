import { IsOptional, IsString } from "class-validator";
import { PaginationDto } from "../../shared/pagination.dto";

export class PropertyListQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  ownerContactId?: string;

  @IsOptional()
  @IsString()
  sort?: string; // "createdAt" | "address"
}

