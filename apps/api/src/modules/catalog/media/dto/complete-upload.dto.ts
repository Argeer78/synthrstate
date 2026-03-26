import { IsOptional, IsString } from "class-validator";

export class CompleteUploadDto {
  @IsOptional()
  @IsString()
  etag?: string;
}

