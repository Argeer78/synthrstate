import { IsBoolean, IsOptional, IsString, MinLength } from "class-validator";

export class ResetPasswordDto {
  @IsString()
  @MinLength(8)
  newPassword!: string;

  /**
   * Explicit confirmation flag for self-reset via admin endpoint.
   * UI should only send this when the admin confirms.
   */
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}

