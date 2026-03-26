import { IsOptional, IsInt, Min, Max, IsBoolean } from "class-validator";
import { Type } from "class-transformer";

export class GenerateLeadSummaryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(25)
  maxNotes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(25)
  maxTasks?: number;

  @IsOptional()
  @IsBoolean()
  includeInquiries?: boolean;
}

