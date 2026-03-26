import { TaskStatus } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { PaginationDto } from "../../shared/pagination.dto";

export class TaskListQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsString()
  assignedToMembershipId?: string;

  @IsOptional()
  @IsString()
  leadId?: string;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : String(value)))
  @IsString()
  sort?: string; // "dueAt" | "createdAt"
}

