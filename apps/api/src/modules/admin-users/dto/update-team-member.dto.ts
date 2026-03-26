import { Type } from "class-transformer";
import { IsBoolean, IsEnum, IsOptional } from "class-validator";
import { UserRole, UserStatus } from "@prisma/client";

export class UpdateTeamMemberDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  /**
   * MVP safety toggle:
   * - OWNER can deactivate their own account only when `force: true`.
   */
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}

