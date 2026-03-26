import { IsArray, IsString, ArrayMinSize } from "class-validator";

export class ReorderListingMediaDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  orderedAssetIds!: string[];
}

