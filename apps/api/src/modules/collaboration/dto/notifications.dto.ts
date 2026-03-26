import { Transform } from "class-transformer";
import { IsOptional, Max, Min } from "class-validator";

export class ListNotificationsQueryDto {
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : String(value)))
  cursor?: string;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @Min(1)
  @Max(50)
  take?: number;
}

export class MarkReadDto {
  ids!: string[];
}

