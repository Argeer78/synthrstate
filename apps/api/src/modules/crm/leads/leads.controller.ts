import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { TenantGuard } from "../../auth/guards/tenant.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/roles.decorator";
import { ROLES_MUTATE } from "../../auth/rbac.constants";
import { getAuthContext } from "../shared/tenant.req";
import { getPagination } from "../shared/pagination.dto";
import { LeadListQueryDto } from "./dto/lead.query.dto";
import { CreateLeadDto, UpdateLeadDto } from "./dto/lead.dto";
import { LeadsService } from "./leads.service";

@Controller("crm/leads")
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Post()
  @Roles(...ROLES_MUTATE)
  async create(@Req() req: Request, @Body() dto: CreateLeadDto) {
    const { agencyId, membershipId, role } = getAuthContext(req);
    return this.leads.create({
      agencyId,
      actor: { role, membershipId },
      actorMembershipId: membershipId,
      data: dto,
    });
  }

  @Get()
  async list(@Req() req: Request, @Query() query: LeadListQueryDto) {
    const { agencyId, role, membershipId } = getAuthContext(req);
    const { skip, take, page, pageSize } = getPagination(query);
    const { items, total } = await this.leads.list({
      agencyId,
      actor: { role, membershipId },
      status: query.status,
      assignedToMembershipId: query.assignedToMembershipId,
      contactId: query.contactId,
      q: query.q,
      skip,
      take,
    });
    return { items, pageInfo: { page, pageSize, total, hasNextPage: skip + items.length < total } };
  }

  @Get(":id")
  async get(@Req() req: Request, @Param("id") id: string) {
    const { agencyId, role, membershipId } = getAuthContext(req);
    return this.leads.get({ agencyId, actor: { role, membershipId }, id });
  }

  @Patch(":id")
  @Roles(...ROLES_MUTATE)
  async update(@Req() req: Request, @Param("id") id: string, @Body() dto: UpdateLeadDto) {
    const { agencyId, membershipId, role } = getAuthContext(req);
    return this.leads.update({
      agencyId,
      actor: { role, membershipId },
      actorMembershipId: membershipId,
      id,
      data: dto,
    });
  }

  @Delete(":id")
  @Roles(...ROLES_MUTATE)
  async delete(@Req() req: Request, @Param("id") id: string) {
    const { agencyId, membershipId, role } = getAuthContext(req);
    return this.leads.delete({ agencyId, actor: { role, membershipId }, actorMembershipId: membershipId, id });
  }
}

