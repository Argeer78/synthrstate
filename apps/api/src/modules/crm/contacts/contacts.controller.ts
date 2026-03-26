import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { UserRole } from "@prisma/client";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { TenantGuard } from "../../auth/guards/tenant.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/roles.decorator";
import { ROLES_MUTATE } from "../../auth/rbac.constants";
import { getAuthContext } from "../shared/tenant.req";
import { ContactsService } from "./contacts.service";
import { CreateContactDto, UpdateContactDto } from "./dto/contact.dto";
import { ContactListQueryDto } from "./dto/contact.query.dto";
import { getPagination } from "../shared/pagination.dto";

@Controller("crm/contacts")
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class ContactsController {
  constructor(private readonly contacts: ContactsService) {}

  @Post()
  @Roles(...ROLES_MUTATE)
  async create(@Req() req: Request, @Body() dto: CreateContactDto) {
    const { agencyId, membershipId } = getAuthContext(req);
    return this.contacts.create({ agencyId, actorMembershipId: membershipId, data: dto });
  }

  @Get()
  async list(@Req() req: Request, @Query() query: ContactListQueryDto) {
    const { agencyId, role, membershipId } = getAuthContext(req);
    const { skip, take, page, pageSize } = getPagination(query);
    const sort = query.sort === "lastName" ? "lastName" : "createdAt";
    const { items, total } = await this.contacts.list({
      agencyId,
      actor: { role, membershipId },
      q: query.q,
      skip,
      take,
      sort,
    });
    return { items, pageInfo: { page, pageSize, total, hasNextPage: skip + items.length < total } };
  }

  @Get(":id")
  async get(@Req() req: Request, @Param("id") id: string) {
    const { agencyId, role, membershipId } = getAuthContext(req);
    return this.contacts.get({ agencyId, actor: { role, membershipId }, id });
  }

  @Patch(":id")
  @Roles(...ROLES_MUTATE)
  async update(@Req() req: Request, @Param("id") id: string, @Body() dto: UpdateContactDto) {
    const { agencyId, membershipId, role } = getAuthContext(req);
    return this.contacts.update({
      agencyId,
      actor: { role, membershipId },
      actorMembershipId: membershipId,
      id,
      data: dto,
    });
  }

  @Delete(":id")
  @Roles(UserRole.OWNER)
  async delete(@Req() req: Request, @Param("id") id: string) {
    const { agencyId, membershipId, role } = getAuthContext(req);
    return this.contacts.delete({ agencyId, actor: { role, membershipId }, actorMembershipId: membershipId, id });
  }
}

