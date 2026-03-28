import { Body, Controller, Get, Patch, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { TenantGuard } from "../auth/guards/tenant.guard";
import { getAuthContext } from "../crm/shared/tenant.req";
import { OnboardingService } from "./onboarding.service";
import { UpdateAdminProfileDto, UpdateAgencyBasicsDto, UpdateBrandingDto } from "./dto/onboarding.dto";

@Controller("onboarding")
@UseGuards(JwtAuthGuard, TenantGuard)
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Get("status")
  async status(@Req() req: Request) {
    const ctx = getAuthContext(req);
    return await this.onboarding.getStatus({ agencyId: ctx.agencyId, membershipId: ctx.membershipId });
  }

  @Patch("agency-basics")
  async agencyBasics(@Req() req: Request, @Body() dto: UpdateAgencyBasicsDto) {
    const ctx = getAuthContext(req);
    return await this.onboarding.updateAgencyBasics({
      agencyId: ctx.agencyId,
      role: ctx.role,
      name: dto.name,
      phone: dto.phone,
      email: dto.email,
      logoUrl: dto.logoUrl,
    });
  }

  @Patch("branding")
  async branding(@Req() req: Request, @Body() dto: UpdateBrandingDto) {
    const ctx = getAuthContext(req);
    return await this.onboarding.updateBranding({
      agencyId: ctx.agencyId,
      role: ctx.role,
      descriptionShort: dto.descriptionShort,
      officeAddress: dto.officeAddress,
      brandColorHex: dto.brandColorHex,
    });
  }

  @Patch("admin-profile")
  async adminProfile(@Req() req: Request, @Body() dto: UpdateAdminProfileDto) {
    const ctx = getAuthContext(req);
    return await this.onboarding.updateAdminProfile({
      agencyId: ctx.agencyId,
      membershipId: ctx.membershipId,
      role: ctx.role,
      fullName: dto.fullName,
      phone: dto.phone,
      titleLabel: dto.titleLabel,
    });
  }

  @Post("dismiss")
  async dismiss(@Req() req: Request) {
    const ctx = getAuthContext(req);
    return await this.onboarding.dismiss({ agencyId: ctx.agencyId, role: ctx.role });
  }

  @Post("complete")
  async complete(@Req() req: Request) {
    const ctx = getAuthContext(req);
    return await this.onboarding.complete({ agencyId: ctx.agencyId, role: ctx.role });
  }
}

