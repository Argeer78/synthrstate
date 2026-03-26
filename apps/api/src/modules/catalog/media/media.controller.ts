import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { TenantGuard } from "../../auth/guards/tenant.guard";
import { getAuthContext } from "../shared/tenant.req";
import { getPagination } from "../shared/pagination.dto";
import { CreateListingImageUploadDto } from "./dto/create-listing-image-upload.dto";
import { CompleteUploadDto } from "./dto/complete-upload.dto";
import { ReorderListingMediaDto } from "./dto/reorder-listing-media.dto";
import { MediaListQueryDto } from "./dto/media-list-query.dto";
import { SetCoverDto } from "./dto/set-cover.dto";
import { MediaService } from "./media.service";

@Controller("catalog/listings")
@UseGuards(JwtAuthGuard, TenantGuard)
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Get(":listingId/media")
  async list(
    @Req() req: Request,
    @Param("listingId", new ParseUUIDPipe({ version: "4" })) listingId: string,
    @Query() query: MediaListQueryDto,
  ) {
    const { agencyId } = getAuthContext(req);
    const { skip, take, page, pageSize } = getPagination(query);
    const { items, total } = await this.media.listListingMedia({
      agencyId,
      listingId,
      skip,
      take,
      includeDeleted: query.includeDeleted === true,
      mediaType: query.mediaType,
      onlyActiveUploads: !query.includeDeleted,
    });
    return { items, pageInfo: { page, pageSize, total, hasNextPage: skip + items.length < total } };
  }

  @Post(":listingId/media/images/upload")
  async createUpload(
    @Req() req: Request,
    @Param("listingId", new ParseUUIDPipe({ version: "4" })) listingId: string,
    @Body() dto: CreateListingImageUploadDto,
  ) {
    const { agencyId, membershipId } = getAuthContext(req);
    return this.media.createSignedImageUpload({
      agencyId,
      listingId,
      actorMembershipId: membershipId,
      fileName: dto.fileName,
      contentType: dto.contentType,
      sizeBytes: dto.sizeBytes,
    });
  }

  @Post(":listingId/media/:assetId/complete")
  async completeUpload(
    @Req() req: Request,
    @Param("listingId", new ParseUUIDPipe({ version: "4" })) listingId: string,
    @Param("assetId", new ParseUUIDPipe({ version: "4" })) assetId: string,
    @Body() dto: CompleteUploadDto,
  ) {
    const { agencyId } = getAuthContext(req);
    return this.media.completeUpload({
      agencyId,
      listingId,
      assetId,
      etag: dto.etag,
    });
  }

  @Delete(":listingId/media/:assetId")
  async deleteMedia(
    @Req() req: Request,
    @Param("listingId", new ParseUUIDPipe({ version: "4" })) listingId: string,
    @Param("assetId", new ParseUUIDPipe({ version: "4" })) assetId: string,
  ) {
    const { agencyId, membershipId } = getAuthContext(req);
    return this.media.softDeleteMedia({ agencyId, listingId, assetId, actorMembershipId: membershipId });
  }

  @Post(":listingId/media/reorder")
  async reorder(
    @Req() req: Request,
    @Param("listingId", new ParseUUIDPipe({ version: "4" })) listingId: string,
    @Body() dto: ReorderListingMediaDto,
  ) {
    const { agencyId } = getAuthContext(req);
    return this.media.reorderListingMedia({ agencyId, listingId, orderedAssetIds: dto.orderedAssetIds });
  }

  @Post(":listingId/media/:assetId/cover")
  async setCover(
    @Req() req: Request,
    @Param("listingId", new ParseUUIDPipe({ version: "4" })) listingId: string,
    @Param("assetId", new ParseUUIDPipe({ version: "4" })) assetId: string,
    @Body() dto: SetCoverDto,
  ) {
    const { agencyId } = getAuthContext(req);
    return this.media.setListingCover({
      agencyId,
      listingId,
      assetId,
      isCover: dto.isCover,
    });
  }
}

