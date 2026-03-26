import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { TenantGuard } from "../auth/guards/tenant.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { ROLES_MUTATE } from "../auth/rbac.constants";
import { getAuthContext } from "../crm/shared/tenant.req";
import { AiService } from "./ai.service";
import { GenerateListingDescriptionDto } from "./dto/generate-listing-description.dto";
import { ApplyGeneratedDescriptionDto } from "./dto/apply-generated-description.dto";
import { GenerateLeadSummaryDto } from "./dto/generate-lead-summary.dto";
import { GenerateBuyerMatchDto } from "./dto/buyer-match.dto";

@Controller("ai")
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post("listings/:listingId/description-generations")
  @Roles(...ROLES_MUTATE)
  async generate(
    @Req() req: Request,
    @Param("listingId", new ParseUUIDPipe({ version: "4" })) listingId: string,
    @Body() dto: GenerateListingDescriptionDto,
  ) {
    const { agencyId, membershipId, role } = getAuthContext(req);
    return this.ai.generateListingDescription({
      agencyId,
      listingId,
      membershipId,
      actor: { role, membershipId },
      tone: dto.tone,
      listingOverride: dto.listingOverride,
    });
  }

  @Get("description-generations/:generationId")
  async getGeneration(
    @Req() req: Request,
    @Param("generationId", new ParseUUIDPipe({ version: "4" })) generationId: string,
  ) {
    const { agencyId, role, membershipId } = getAuthContext(req);
    return this.ai.getGeneration({ agencyId, generationId, actor: { role, membershipId } });
  }

  @Post("description-generations/:generationId/apply")
  @Roles(...ROLES_MUTATE)
  async apply(
    @Req() req: Request,
    @Param("generationId", new ParseUUIDPipe({ version: "4" })) generationId: string,
    @Body() dto: ApplyGeneratedDescriptionDto,
  ) {
    const { agencyId, membershipId, role } = getAuthContext(req);
    return this.ai.applyGeneratedDescription({
      agencyId,
      generationId,
      membershipId,
      role,
      dto,
    });
  }

  @Post("leads/:leadId/summary-generations")
  @Roles(...ROLES_MUTATE)
  async generateLeadSummary(
    @Req() req: Request,
    @Param("leadId") leadId: string,
    @Body() dto: GenerateLeadSummaryDto,
  ) {
    const { agencyId, membershipId, role } = getAuthContext(req);
    return this.ai.generateLeadSummary({
      agencyId,
      leadId,
      membershipId,
      actor: { role, membershipId },
      maxNotes: dto.maxNotes ?? undefined,
      maxTasks: dto.maxTasks ?? undefined,
      includeInquiries: dto.includeInquiries ?? true,
    });
  }

  @Get("summary-generations/:generationId")
  async getLeadSummaryGeneration(
    @Req() req: Request,
    @Param("generationId") generationId: string,
  ) {
    const { agencyId, role, membershipId } = getAuthContext(req);
    return this.ai.getLeadSummaryGeneration({ agencyId, generationId, actor: { role, membershipId } });
  }

  @Post("leads/:buyerLeadId/match-generations")
  @Roles(...ROLES_MUTATE)
  async generateBuyerMatch(
    @Req() req: Request,
    @Param("buyerLeadId") buyerLeadId: string,
    @Body() dto: GenerateBuyerMatchDto,
  ) {
    const { agencyId, membershipId, role } = getAuthContext(req);
    return this.ai.generateBuyerPropertyMatch({
      agencyId,
      buyerLeadId,
      membershipId,
      actor: { role, membershipId },
      limit: dto.limit ?? undefined,
      preferencesOverride: dto.preferencesOverride ?? undefined,
    });
  }

  @Get("match-generations/:generationId")
  async getBuyerMatchGeneration(
    @Req() req: Request,
    @Param("generationId") generationId: string,
  ) {
    const { agencyId, role, membershipId } = getAuthContext(req);
    return this.ai.getBuyerMatchGeneration({ agencyId, generationId, actor: { role, membershipId } });
  }
}

