import { IsOptional, IsString, IsUUID, Max, Min } from "class-validator";
import { Transform } from "class-transformer";

export class GmailThreadsQueryDto {
  @IsOptional()
  @IsUUID("4")
  contactId?: string;

  @IsOptional()
  @IsUUID("4")
  leadId?: string;
}

export class GmailSyncDto {
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @Min(1)
  @Max(50)
  maxThreads?: number;
}

export class GmailThreadAiDto {
  @IsString()
  threadId!: string;
}

export class GmailCreateDraftDto {
  @IsString()
  threadId!: string;

  @IsString()
  to!: string;

  @IsString()
  subject!: string;

  @IsString()
  body!: string;
}

