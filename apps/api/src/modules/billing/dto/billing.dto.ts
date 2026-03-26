import { IsIn, IsOptional, IsString } from "class-validator";

export class CreateCheckoutSessionDto {
  @IsIn(["STARTER", "GROWTH"])
  plan!: "STARTER" | "GROWTH";
}

export class CreatePortalSessionDto {
  @IsOptional()
  @IsString()
  returnUrl?: string;
}

