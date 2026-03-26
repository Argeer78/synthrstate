import { IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { CommentTargetType } from "@prisma/client";

export class ListCommentsQueryDto {
  @IsEnum(CommentTargetType)
  targetType!: CommentTargetType;

  @IsString()
  targetId!: string;
}

export class CreateCommentDto {
  @IsEnum(CommentTargetType)
  targetType!: CommentTargetType;

  @IsString()
  targetId!: string;

  @IsString()
  body!: string;

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

