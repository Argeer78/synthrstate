import { IsEnum, IsOptional, IsBoolean } from "class-validator";
import { PaginationDto } from "../../shared/pagination.dto";
import { MediaType } from "@prisma/client";
import { Transform } from "class-transformer";

export class MediaListQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(MediaType)
  mediaType?: MediaType;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  includeDeleted?: boolean;
}

