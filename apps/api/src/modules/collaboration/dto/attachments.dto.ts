import { AttachmentTargetType } from "@prisma/client";
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

export class ListAttachmentsQueryDto {
  @IsEnum(AttachmentTargetType)
  targetType!: AttachmentTargetType;

  @IsString()
  targetId!: string;
}

export class CreateSignedUploadDto {
  @IsEnum(AttachmentTargetType)
  targetType!: AttachmentTargetType;

  @IsString()
  targetId!: string;

  @IsString()
  fileName!: string;

  @IsString()
  contentType!: string;

  @IsInt()
  @Min(1)
  @Max(50_000_000)
  sizeBytes!: number;

  @IsOptional()
  @IsUUID("4")
  leadId?: string;

  @IsOptional()
  @IsUUID("4")
  listingId?: string;

  @IsOptional()
  @IsUUID("4")
  taskId?: string;
}

export class CompleteUploadDto {
  @IsString()
  attachmentId!: string;
}

