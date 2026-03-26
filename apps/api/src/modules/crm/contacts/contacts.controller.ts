import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { TenantGuard } from "../../auth/guards/tenant.guard";
import { getAuthContext } from "../shared/tenant.req";
import { ContactsService } from "./contacts.service";
import { CreateContactDto, UpdateContactDto } from "./dto/contact.dto";
import { ContactListQueryDto } from "./dto/contact.query.dto";
import { getPagination } from "../shared/pagination.dto";

@Controller("crm/contacts")
@UseGuards(JwtAuthGuard, TenantGuard)
export class ContactsController {
  constructor(private readonly contacts: ContactsService) {}

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateContactDto) {
    const { agencyId, membershipId } = getAuthContext(req);
    return this.contacts.create({ agencyId, actorMembershipId: membershipId, data: dto });
  }

  @Get()
  async list(@Req() req: Request, @Query() query: ContactListQueryDto) {
    const { agencyId } = getAuthContext(req);
    const { skip, take, page, pageSize } = getPagination(query);
    const sort = query.sort === "lastName" ? "lastName" : "createdAt";
    const { items, total } = await this.contacts.list({
      agencyId,
      q: query.q,
      skip,
      take,
      sort,
    });
    return { items, pageInfo: { page, pageSize, total, hasNextPage: skip + items.length < total } };
  }

  @Get(":id")
  async get(@Req() req: Request, @Param("id") id: string) {
    const { agencyId } = getAuthContext(req);
    return this.contacts.get({ agencyId, id });
  }

  @Patch(":id")
  async update(@Req() req: Request, @Param("id") id: string, @Body() dto: UpdateContactDto) {
    const { agencyId, membershipId } = getAuthContext(req);
    return this.contacts.update({ agencyId, actorMembershipId: membershipId, id, data: dto });
  }

  @Delete(":id")
  async delete(@Req() req: Request, @Param("id") id: string) {
    const { agencyId, membershipId } = getAuthContext(req);
    return this.contacts.delete({ agencyId, actorMembershipId: membershipId, id });
  }
}

