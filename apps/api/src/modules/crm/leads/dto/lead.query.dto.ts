import { LeadStatus } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { PaginationDto } from "../../shared/pagination.dto";

export class LeadListQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @IsOptional()
  @IsString()
  assignedToMembershipId?: string;

  @IsOptional()
  @IsString()
  contactId?: string;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : String(value)))
  @IsString()
  sort?: string; // "createdAt"

  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string; // searches contact name/email/phone (basic)
}

