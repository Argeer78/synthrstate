import { IsIn, IsInt, IsString, Min } from "class-validator";

export class CreateListingImageUploadDto {
  @IsString()
  fileName!: string;

  @IsString()
  // allow-list enforced server-side too
  contentType!: string;

  @IsInt()
  @Min(1)
  sizeBytes!: number;
}

