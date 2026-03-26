import { IsBoolean } from "class-validator";

export class SetCoverDto {
  @IsBoolean()
  isCover!: boolean;
}

