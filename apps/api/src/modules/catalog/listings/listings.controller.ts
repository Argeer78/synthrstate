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
import { CreateInternalNoteDto } from "./dto/internal-note.dto";
import { CreateListingDto } from "./dto/create-listing.dto";
import { ListingListQueryDto } from "./dto/listing-query.dto";
import { InternalNotesListQueryDto } from "./dto/internal-notes.query.dto";
import { UpdateListingDto } from "./dto/update-listing.dto";
import { UpsertListingTranslationDto } from "./dto/translations.dto";
import { ListingsService } from "./listings.service";

@Controller("catalog/listings")
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class ListingsController {
  constructor(private readonly listings: ListingsService) {}

  @Post()
  @Roles(...ROLES_MUTATE)
  async create(@Req() req: Request, @Body() dto: CreateListingDto) {
    const { agencyId, membershipId, role } = getAuthContext(req);
    return this.listings.create({
      agencyId,
      actor: { role, membershipId },
      actorMembershipId: membershipId,
      data: dto,
    });
  }

  @Get()
  async list(@Req() req: Request, @Query() query: ListingListQueryDto) {
    const { agencyId, role, membershipId } = getAuthContext(req);
    const { skip, take, page, pageSize } = getPagination(query);
    const { items, total } = await this.listings.list({
      agencyId,
      actor: { role, membershipId },
      listingType: query.listingType,
      status: query.status,
      ownerContactId: query.ownerContactId,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      q: query.q,
      bedrooms: query.bedrooms,
      skip,
      take,
    });

    return { items, pageInfo: { page, pageSize, total, hasNextPage: skip + items.length < total } };
  }

  @Get(":id")
  async get(@Req() req: Request, @Param("id") id: string) {
    const { agencyId, role, membershipId } = getAuthContext(req);
    return this.listings.get({ agencyId, actor: { role, membershipId }, id });
  }

  @Patch(":id")
  @Roles(...ROLES_MUTATE)
  async update(@Req() req: Request, @Param("id") id: string, @Body() dto: UpdateListingDto) {
    const { agencyId, membershipId, role } = getAuthContext(req);
    return this.listings.update({
      agencyId,
      actor: { role, membershipId },
      actorMembershipId: membershipId,
      id,
      data: dto,
    });
  }

  @Delete(":id")
  @Roles(UserRole.OWNER)
  async softDelete(@Req() req: Request, @Param("id") id: string) {
    const { agencyId, membershipId, role } = getAuthContext(req);
    return this.listings.softDelete({ agencyId, actor: { role, membershipId }, actorMembershipId: membershipId, id });
  }

  @Post(":id/internal-notes")
  @Roles(...ROLES_MUTATE)
  async createInternalNote(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: CreateInternalNoteDto,
  ) {
    const { agencyId, membershipId, role } = getAuthContext(req);
    return this.listings.createInternalNote({
      agencyId,
      actor: { role, membershipId },
      actorMembershipId: membershipId,
      listingId: id,
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
    const { items, total } = await this.listings.listInternalNotes({
      agencyId,
      actor: { role, membershipId },
      listingId: id,
      skip,
      take,
    });
    return { items, pageInfo: { page, pageSize, total, hasNextPage: skip + items.length < total } };
  }

  @Delete(":id/internal-notes/:noteId")
  @Roles(...ROLES_MUTATE)
  async deleteInternalNote(@Req() req: Request, @Param("id") id: string, @Param("noteId") noteId: string) {
    const { agencyId, role, membershipId } = getAuthContext(req);
    return this.listings.deleteInternalNote({ agencyId, actor: { role, membershipId }, listingId: id, noteId });
  }

  @Get(":id/translations")
  async listTranslations(@Req() req: Request, @Param("id") id: string) {
    const { agencyId, role, membershipId } = getAuthContext(req);
    return this.listings.listTranslations({ agencyId, actor: { role, membershipId }, listingId: id });
  }

  @Patch(":id/translations/:languageCode")
  @Roles(...ROLES_MUTATE)
  async upsertTranslation(
    @Req() req: Request,
    @Param("id") id: string,
    @Param("languageCode") languageCode: string,
    @Body() dto: UpsertListingTranslationDto,
  ) {
    const { agencyId, role, membershipId } = getAuthContext(req);
    return this.listings.upsertTranslation({
      agencyId,
      actor: { role, membershipId },
      actorMembershipId: membershipId,
      listingId: id,
      languageCode,
      title: dto.title,
      description: dto.description,
      shortDescription: dto.shortDescription,
      reviewStatus: dto.reviewStatus,
    });
  }
}

