import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { TenantGuard } from "../../auth/guards/tenant.guard";
import { getAuthContext } from "../shared/tenant.req";
import { getPagination } from "../shared/pagination.dto";
import { CreateInternalNoteDto } from "./dto/internal-note.dto";
import { CreateListingDto } from "./dto/create-listing.dto";
import { ListingListQueryDto } from "./dto/listing-query.dto";
import { InternalNotesListQueryDto } from "./dto/internal-notes.query.dto";
import { UpdateListingDto } from "./dto/update-listing.dto";
import { ListingsService } from "./listings.service";

@Controller("catalog/listings")
@UseGuards(JwtAuthGuard, TenantGuard)
export class ListingsController {
  constructor(private readonly listings: ListingsService) {}

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateListingDto) {
    const { agencyId, membershipId } = getAuthContext(req);
    return this.listings.create({
      agencyId,
      actorMembershipId: membershipId,
      data: dto,
    });
  }

  @Get()
  async list(@Req() req: Request, @Query() query: ListingListQueryDto) {
    const { agencyId } = getAuthContext(req);
    const { skip, take, page, pageSize } = getPagination(query);
    const { items, total } = await this.listings.list({
      agencyId,
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
    const { agencyId } = getAuthContext(req);
    return this.listings.get({ agencyId, id });
  }

  @Patch(":id")
  async update(@Req() req: Request, @Param("id") id: string, @Body() dto: UpdateListingDto) {
    const { agencyId, membershipId } = getAuthContext(req);
    return this.listings.update({
      agencyId,
      actorMembershipId: membershipId,
      id,
      data: dto,
    });
  }

  @Delete(":id")
  async softDelete(@Req() req: Request, @Param("id") id: string) {
    const { agencyId, membershipId } = getAuthContext(req);
    return this.listings.softDelete({ agencyId, actorMembershipId: membershipId, id });
  }

  @Post(":id/internal-notes")
  async createInternalNote(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: CreateInternalNoteDto,
  ) {
    const { agencyId, membershipId } = getAuthContext(req);
    return this.listings.createInternalNote({
      agencyId,
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
    const { agencyId } = getAuthContext(req);
    const { skip, take, page, pageSize } = getPagination(query);
    const { items, total } = await this.listings.listInternalNotes({
      agencyId,
      listingId: id,
      skip,
      take,
    });
    return { items, pageInfo: { page, pageSize, total, hasNextPage: skip + items.length < total } };
  }

  @Delete(":id/internal-notes/:noteId")
  async deleteInternalNote(@Req() req: Request, @Param("id") id: string, @Param("noteId") noteId: string) {
    const { agencyId } = getAuthContext(req);
    return this.listings.deleteInternalNote({ agencyId, listingId: id, noteId });
  }
}

