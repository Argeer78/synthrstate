import { Transform } from "class-transformer";
import { IsOptional, IsString, MaxLength } from "class-validator";
import { PaginationDto } from "../../shared/pagination.dto";

export class ContactListQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : String(value)))
  @IsString()
  sort?: string; // "createdAt" | "lastName" (MVP)
}

