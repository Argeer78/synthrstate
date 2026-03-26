import { Controller, Get, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { TenantGuard } from "../../auth/guards/tenant.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/roles.decorator";
import { ROLES_MUTATE } from "../../auth/rbac.constants";
import { getAuthContext } from "../shared/tenant.req";
import { PaginationDto, getPagination } from "../shared/pagination.dto";
import { InquiriesService } from "./inquiries.service";
import { IsOptional, IsString } from "class-validator";

class InquiriesQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  leadId?: string;
}

@Controller("crm/inquiries")
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class InquiriesController {
  constructor(private readonly inquiries: InquiriesService) {}

  @Get()
  async list(@Req() req: Request, @Query() query: InquiriesQueryDto) {
    const { agencyId, role, membershipId } = getAuthContext(req);
    const { page, pageSize, skip, take } = getPagination(query);
    const { items, total } = await this.inquiries.list({
      agencyId,
      actor: { role, membershipId },
      skip,
      take,
      leadId: query.leadId,
    });
    return { items, pageInfo: { page, pageSize, total, hasNextPage: skip + items.length < total } };
  }

  @Post(":id/convert")
  @Roles(...ROLES_MUTATE)
  async convert(@Req() req: Request, @Param("id", new ParseUUIDPipe({ version: "4" })) id: string) {
    const { agencyId, role, membershipId } = getAuthContext(req);
    return this.inquiries.convert({
      agencyId,
      actor: { role, membershipId },
      actorMembershipId: membershipId,
      inquiryId: id,
    });
  }
}

