import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { TenantGuard } from "../../auth/guards/tenant.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/roles.decorator";
import { UserRole } from "@prisma/client";
import { getAuthContext } from "../../crm/shared/tenant.req";
import { getPagination, PaginationDto } from "../shared/pagination.dto";
import { ListingPublicationChannelsDto } from "./dto/channels.dto";
import { PublicationsService } from "./publications.service";
import { ROLES_READ } from "../../auth/rbac.constants";

@Controller("catalog/listings")
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class PublicationsController {
  constructor(private readonly publications: PublicationsService) {}

  @Get(":id/publications")
  @Roles(...ROLES_READ)
  async getPublications(@Req() req: Request, @Param("id", new ParseUUIDPipe({ version: "4" })) id: string) {
    const { agencyId, role, membershipId } = getAuthContext(req);
    return this.publications.getListingPublications({ agencyId, actor: { role, membershipId }, listingId: id });
  }

  @Get(":id/publication-logs")
  @Roles(...ROLES_READ)
  async getPublicationLogs(
    @Req() req: Request,
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Query() query: PaginationDto,
  ) {
    const { agencyId, role, membershipId } = getAuthContext(req);
    const { skip, take } = getPagination(query);
    return this.publications.listPublicationLogs({ agencyId, actor: { role, membershipId }, listingId: id, skip, take });
  }

  @Post(":id/publications/publish")
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async publish(@Req() req: Request, @Param("id", new ParseUUIDPipe({ version: "4" })) id: string, @Body() dto: ListingPublicationChannelsDto) {
    const { agencyId, role, membershipId } = getAuthContext(req);
    return this.publications.publishToChannels({
      agencyId,
      actor: { role, membershipId },
      actorRole: role,
      listingId: id,
      channels: dto.channels,
    });
  }

  @Post(":id/publications/unpublish")
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async unpublish(@Req() req: Request, @Param("id", new ParseUUIDPipe({ version: "4" })) id: string, @Body() dto: ListingPublicationChannelsDto) {
    const { agencyId, role, membershipId } = getAuthContext(req);
    return this.publications.unpublishFromChannels({
      agencyId,
      actor: { role, membershipId },
      actorRole: role,
      listingId: id,
      channels: dto.channels,
    });
  }

  @Post(":id/publications/retry")
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async retry(@Req() req: Request, @Param("id", new ParseUUIDPipe({ version: "4" })) id: string, @Body() dto: ListingPublicationChannelsDto) {
    const { agencyId, role, membershipId } = getAuthContext(req);
    return this.publications.retryChannels({
      agencyId,
      actor: { role, membershipId },
      actorRole: role,
      listingId: id,
      channels: dto.channels,
    });
  }

  @Post(":id/publications/refresh")
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async refresh(@Req() req: Request, @Param("id", new ParseUUIDPipe({ version: "4" })) id: string) {
    const { agencyId, role, membershipId } = getAuthContext(req);
    return this.publications.getListingPublications({ agencyId, actor: { role, membershipId }, listingId: id });
  }
}

