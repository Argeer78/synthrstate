import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { TenantGuard } from "../../auth/guards/tenant.guard";
import { getAuthContext } from "../shared/tenant.req";
import { getPagination } from "../shared/pagination.dto";
import { LeadListQueryDto } from "./dto/lead.query.dto";
import { CreateLeadDto, UpdateLeadDto } from "./dto/lead.dto";
import { LeadsService } from "./leads.service";

@Controller("crm/leads")
@UseGuards(JwtAuthGuard, TenantGuard)
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateLeadDto) {
    const { agencyId, membershipId } = getAuthContext(req);
    return this.leads.create({ agencyId, actorMembershipId: membershipId, data: dto });
  }

  @Get()
  async list(@Req() req: Request, @Query() query: LeadListQueryDto) {
    const { agencyId } = getAuthContext(req);
    const { skip, take, page, pageSize } = getPagination(query);
    const { items, total } = await this.leads.list({
      agencyId,
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
    const { agencyId } = getAuthContext(req);
    return this.leads.get({ agencyId, id });
  }

  @Patch(":id")
  async update(@Req() req: Request, @Param("id") id: string, @Body() dto: UpdateLeadDto) {
    const { agencyId, membershipId } = getAuthContext(req);
    return this.leads.update({ agencyId, actorMembershipId: membershipId, id, data: dto });
  }

  @Delete(":id")
  async delete(@Req() req: Request, @Param("id") id: string) {
    const { agencyId, membershipId } = getAuthContext(req);
    return this.leads.delete({ agencyId, actorMembershipId: membershipId, id });
  }
}

