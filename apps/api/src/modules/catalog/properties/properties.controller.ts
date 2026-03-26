import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { UserRole } from "@prisma/client";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { TenantGuard } from "../../auth/guards/tenant.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/roles.decorator";
import { ROLES_MUTATE } from "../../auth/rbac.constants";
import { getAuthContext } from "../shared/tenant.req";
import { getPagination } from "../shared/pagination.dto";
import { CreatePropertyDto } from "./dto/create-property.dto";
import { PropertyListQueryDto } from "./dto/property.query.dto";
import { UpdatePropertyDto } from "./dto/update-property.dto";
import { CreatePropertyInternalNoteDto } from "./dto/internal-note.dto";
import { InternalNotesListQueryDto } from "./dto/internal-notes.query.dto";
import { PropertiesService } from "./properties.service";

@Controller("catalog/properties")
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class PropertiesController {
  constructor(private readonly properties: PropertiesService) {}

  @Post()
  @Roles(...ROLES_MUTATE)
  async create(@Req() req: Request, @Body() dto: CreatePropertyDto) {
    const { agencyId, membershipId, role } = getAuthContext(req);
    return this.properties.create({
      agencyId,
      actor: { role, membershipId },
      actorMembershipId: membershipId,
      ownerContactId: dto.ownerContactId,
      data: {
        address: dto.address,
        city: dto.city,
        area: dto.area,
        latitude: dto.latitude,
        longitude: dto.longitude,
        energyClass: dto.energyClass,
        features: dto.features,
      },
    });
  }

  @Get()
  async list(@Req() req: Request, @Query() query: PropertyListQueryDto) {
    const { agencyId, role, membershipId } = getAuthContext(req);
    const { skip, take, page, pageSize } = getPagination(query);
    const sort = query.sort === "address" ? "address" : "createdAt";
    const { items, total } = await this.properties.list({
      agencyId,
      actor: { role, membershipId },
      q: query.q,
      ownerContactId: query.ownerContactId,
      skip,
      take,
      sort: sort as any,
    });
    return { items, pageInfo: { page, pageSize, total, hasNextPage: skip + items.length < total } };
  }

  @Get(":id")
  async get(@Req() req: Request, @Param("id") id: string) {
    const { agencyId, role, membershipId } = getAuthContext(req);
    return this.properties.get({ agencyId, actor: { role, membershipId }, id });
  }

  @Patch(":id")
  @Roles(...ROLES_MUTATE)
  async update(@Req() req: Request, @Param("id") id: string, @Body() dto: UpdatePropertyDto) {
    const { agencyId, membershipId, role } = getAuthContext(req);
    return this.properties.update({
      agencyId,
      actor: { role, membershipId },
      actorMembershipId: membershipId,
      id,
      data: {
        ownerContactId: dto.ownerContactId,
        address: dto.address,
        city: dto.city,
        area: dto.area,
        latitude: dto.latitude,
        longitude: dto.longitude,
        energyClass: dto.energyClass,
        features: dto.features,
      },
    });
  }

  @Delete(":id")
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async delete(@Req() req: Request, @Param("id") id: string) {
    const { agencyId, membershipId, role } = getAuthContext(req);
    return this.properties.softDelete({ agencyId, actor: { role, membershipId }, actorMembershipId: membershipId, id });
  }

  @Post(":id/internal-notes")
  @Roles(...ROLES_MUTATE)
  async createInternalNote(@Req() req: Request, @Param("id") id: string, @Body() dto: CreatePropertyInternalNoteDto) {
    const { agencyId, membershipId, role } = getAuthContext(req);
    return this.properties.createInternalNote({
      agencyId,
      actor: { role, membershipId },
      actorMembershipId: membershipId,
      propertyId: id,
      content: dto.content,
    });
  }

  @Get(":id/internal-notes")
  async listInternalNotes(
    @Req() req: Request,
    @Param("id") id: string,
    @Query() query: InternalNotesListQueryDto,
  ) {
    const { agencyId, role, membershipId } = getAuthContext(req);
    const { skip, take, page, pageSize } = getPagination(query);
    const { items, total } = await this.properties.listInternalNotes({
      agencyId,
      actor: { role, membershipId },
      propertyId: id,
      skip,
      take,
    });
    return { items, pageInfo: { page, pageSize, total, hasNextPage: skip + items.length < total } };
  }

  @Delete(":id/internal-notes/:noteId")
  @Roles(...ROLES_MUTATE)
  async deleteInternalNote(@Req() req: Request, @Param("id") id: string, @Param("noteId") noteId: string) {
    const { agencyId, role, membershipId } = getAuthContext(req);
    return this.properties.deleteInternalNote({ agencyId, actor: { role, membershipId }, propertyId: id, noteId });
  }
}

