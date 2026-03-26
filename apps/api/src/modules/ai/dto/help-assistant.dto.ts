import { IsOptional, IsString, MaxLength } from "class-validator";

export class HelpAssistantDto {
  @IsString()
  @MaxLength(1200)
  question!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  pageHint?: string;
}

