import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { TenantGuard } from "../../auth/guards/tenant.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/roles.decorator";
import { ROLES_MUTATE } from "../../auth/rbac.constants";
import { getAuthContext } from "../shared/tenant.req";
import { getPagination } from "../shared/pagination.dto";
import { CreateListingImageUploadDto } from "./dto/create-listing-image-upload.dto";
import { CompleteUploadDto } from "./dto/complete-upload.dto";
import { ReorderListingMediaDto } from "./dto/reorder-listing-media.dto";
import { MediaListQueryDto } from "./dto/media-list-query.dto";
import { SetCoverDto } from "./dto/set-cover.dto";
import { MediaService } from "./media.service";

@Controller("catalog/listings")
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Get(":listingId/media")
  async list(
    @Req() req: Request,
    @Param("listingId", new ParseUUIDPipe({ version: "4" })) listingId: string,
    @Query() query: MediaListQueryDto,
  ) {
    const { agencyId, role, membershipId } = getAuthContext(req);
    const { skip, take, page, pageSize } = getPagination(query);
    const { items, total } = await this.media.listListingMedia({
      agencyId,
      listingId,
      actor: { role, membershipId },
      skip,
      take,
      includeDeleted: query.includeDeleted === true,
      mediaType: query.mediaType,
      onlyActiveUploads: !query.includeDeleted,
    });
    return { items, pageInfo: { page, pageSize, total, hasNextPage: skip + items.length < total } };
  }

  @Post(":listingId/media/images/upload")
  @Roles(...ROLES_MUTATE)
  async createUpload(
    @Req() req: Request,
    @Param("listingId", new ParseUUIDPipe({ version: "4" })) listingId: string,
    @Body() dto: CreateListingImageUploadDto,
  ) {
    const { agencyId, membershipId, role } = getAuthContext(req);
    return this.media.createSignedImageUpload({
      agencyId,
      listingId,
      actor: { role, membershipId },
      actorMembershipId: membershipId,
      fileName: dto.fileName,
      contentType: dto.contentType,
      sizeBytes: dto.sizeBytes,
    });
  }

  @Post(":listingId/media/:assetId/complete")
  @Roles(...ROLES_MUTATE)
  async completeUpload(
    @Req() req: Request,
    @Param("listingId", new ParseUUIDPipe({ version: "4" })) listingId: string,
    @Param("assetId", new ParseUUIDPipe({ version: "4" })) assetId: string,
    @Body() dto: CompleteUploadDto,
  ) {
    const { agencyId, role, membershipId } = getAuthContext(req);
    return this.media.completeUpload({
      agencyId,
      listingId,
      actor: { role, membershipId },
      assetId,
      etag: dto.etag,
    });
  }

  @Delete(":listingId/media/:assetId")
  @Roles(...ROLES_MUTATE)
  async deleteMedia(
    @Req() req: Request,
    @Param("listingId", new ParseUUIDPipe({ version: "4" })) listingId: string,
    @Param("assetId", new ParseUUIDPipe({ version: "4" })) assetId: string,
  ) {
    const { agencyId, membershipId, role } = getAuthContext(req);
    return this.media.softDeleteMedia({
      agencyId,
      listingId,
      actor: { role, membershipId },
      assetId,
      actorMembershipId: membershipId,
    });
  }

  @Post(":listingId/media/reorder")
  @Roles(...ROLES_MUTATE)
  async reorder(
    @Req() req: Request,
    @Param("listingId", new ParseUUIDPipe({ version: "4" })) listingId: string,
    @Body() dto: ReorderListingMediaDto,
  ) {
    const { agencyId, role, membershipId } = getAuthContext(req);
    return this.media.reorderListingMedia({
      agencyId,
      listingId,
      actor: { role, membershipId },
      orderedAssetIds: dto.orderedAssetIds,
    });
  }

  @Post(":listingId/media/:assetId/cover")
  @Roles(...ROLES_MUTATE)
  async setCover(
    @Req() req: Request,
    @Param("listingId", new ParseUUIDPipe({ version: "4" })) listingId: string,
    @Param("assetId", new ParseUUIDPipe({ version: "4" })) assetId: string,
    @Body() dto: SetCoverDto,
  ) {
    const { agencyId, role, membershipId } = getAuthContext(req);
    return this.media.setListingCover({
      agencyId,
      listingId,
      actor: { role, membershipId },
      assetId,
      isCover: dto.isCover,
    });
  }
}

