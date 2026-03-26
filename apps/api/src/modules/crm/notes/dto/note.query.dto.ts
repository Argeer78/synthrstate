import { IsOptional, IsString } from "class-validator";
import { PaginationDto } from "../../shared/pagination.dto";

export class NoteListQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  contactId?: string;

  @IsOptional()
  @IsString()
  leadId?: string;
}

