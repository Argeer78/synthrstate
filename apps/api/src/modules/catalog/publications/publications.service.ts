import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import type { ActorScope } from "../../auth/rbac-query.util";
import { listingScopeWhere } from "../../auth/rbac-query.util";
import {
  ListingStatus,
  ListingPublicationStatus,
  PublicationAttemptStatus,
  UserRole,
} from "@prisma/client";
import type { PublicationChannelCode } from "./publications.constants";
import { getPublicationChannelConfig, PUBLICATION_CHANNELS } from "./publications.constants";
import { PublicationLog, ListingPublication } from "@prisma/client";

// Note: We simulate publication adapter processing (queue-friendly for later).
@Injectable()
export class PublicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getListingPublications(params: {
    agencyId: string;
    actor: ActorScope;
    listingId: string;
  }) {
    const listing = await this.prisma.listing.findFirst({
      where: { id: params.listingId, agencyId: params.agencyId, deletedAt: null, property: { deletedAt: null }, ...listingScopeWhere(params.actor) },
      select: { id: true, status: true, updatedAt: true },
    });
    if (!listing) throw new NotFoundException("Listing not found");

    // MVP: treat listing.status ACTIVE as "Website succeeded" (legacy publish compatibility).
    if (listing.status === "ACTIVE") {
      await this.ensureWebsitePublicationLegacy(params);
    }

    const publicationRows = await this.prisma.listingPublication.findMany({
      where: { agencyId: params.agencyId, listingId: params.listingId },
      include: { channel: { select: { code: true, displayName: true, channelType: true } } },
    });

    const byCode = new Map<string, ListingPublication & { channel?: { code: string } }>();
    for (const row of publicationRows) byCode.set(row.channel.code, row as any);

    const logs = await this.prisma.publicationLog.findMany({
      where: { agencyId: params.agencyId, listingPublication: { listingId: params.listingId } },
      orderBy: { startedAt: "desc" },
      take: 100,
      include: {
        listingPublication: { include: { channel: { select: { code: true } } } },
      },
    });

    const lastAttempt = logs[0]?.startedAt ?? null;
    const lastSuccess = logs.find((l) => l.status === PublicationAttemptStatus.SUCCESS)?.finishedAt ?? null;
    const lastFailure = logs.find((l) => l.status === PublicationAttemptStatus.FAILED)?.finishedAt ?? null;

    const channelStates = PUBLICATION_CHANNELS.map((c) => {
      const row = byCode.get(c.code) as ListingPublication | undefined;
      const selected = Boolean(row && row.status !== ListingPublicationStatus.CANCELLED);
      return {
        code: c.code,
        displayName: c.displayName,
        channelType: c.channelType,
        publicationStatus: row?.status ?? null,
        selected,
      };
    });

    // For UI convenience: attach last log per channel.
    const lastLogByChannel = new Map<string, PublicationLog & { action?: string | null }>();
    for (const l of logs) {
      const channelCode = (l.listingPublication as any)?.channel?.code as string | undefined;
      if (!channelCode) continue;
      if (lastLogByChannel.has(channelCode)) continue;
      let action: string | null = null;
      const payload = l.requestPayload as unknown as Record<string, unknown> | null;
      if (payload && typeof payload === "object") {
        const v = (payload as any).action;
        if (typeof v === "string") action = v;
      }
      lastLogByChannel.set(channelCode, Object.assign({}, l, { action }));
    }

    const channels = channelStates.map((ch) => {
      const lastLog = lastLogByChannel.get(ch.code);
      return { ...ch, lastSync: lastLog ? { startedAt: lastLog.startedAt, finishedAt: lastLog.finishedAt, status: lastLog.status, message: lastLog.errorMessage, action: (lastLog as any).action ?? null } : null };
    });

    return {
      listingId: params.listingId,
      channels,
      lastAttempt,
      lastSuccess,
      lastFailure,
      selectedChannelCodes: channels.filter((c) => c.selected).map((c) => c.code),
    };
  }

  async publishToChannels(params: { agencyId: string; actor: ActorScope; actorRole: UserRole; listingId: string; channels: PublicationChannelCode[] }) {
    if (!(params.actorRole === UserRole.OWNER || params.actorRole === UserRole.MANAGER)) {
      throw new ForbiddenException("Insufficient role to publish");
    }

    const listing = await this.prisma.listing.findFirst({
      where: { id: params.listingId, agencyId: params.agencyId, deletedAt: null, property: { deletedAt: null }, ...listingScopeWhere(params.actor) },
      select: { id: true, status: true, updatedAt: true },
    });
    if (!listing) throw new NotFoundException("Listing not found");

    await this.runPublicationSimulation(params, "publish");

    // MVP: listing.status ACTIVE represents website being published (succeeded).
    await this.syncListingStatusFromWebsite(params);

    return { ok: true };
  }

  async unpublishFromChannels(params: { agencyId: string; actor: ActorScope; actorRole: UserRole; listingId: string; channels: PublicationChannelCode[] }) {
    if (!(params.actorRole === UserRole.OWNER || params.actorRole === UserRole.MANAGER)) {
      throw new ForbiddenException("Insufficient role to unpublish");
    }

    const listing = await this.prisma.listing.findFirst({
      where: { id: params.listingId, agencyId: params.agencyId, deletedAt: null, property: { deletedAt: null }, ...listingScopeWhere(params.actor) },
      select: { id: true, status: true },
    });
    if (!listing) throw new NotFoundException("Listing not found");

    for (const code of params.channels) {
      await this.cancelChannelPublication({ agencyId: params.agencyId, listingId: params.listingId, code });
    }
    await this.syncListingStatusFromWebsite(params);

    return { ok: true };
  }

  async retryChannels(params: { agencyId: string; actor: ActorScope; actorRole: UserRole; listingId: string; channels: PublicationChannelCode[] }) {
    if (!(params.actorRole === UserRole.OWNER || params.actorRole === UserRole.MANAGER)) {
      throw new ForbiddenException("Insufficient role to retry");
    }

    const listing = await this.prisma.listing.findFirst({
      where: { id: params.listingId, agencyId: params.agencyId, deletedAt: null, property: { deletedAt: null }, ...listingScopeWhere(params.actor) },
      select: { id: true, status: true },
    });
    if (!listing) throw new NotFoundException("Listing not found");

    // MVP: allow retry even if the listingPublication doesn't exist yet (it will be created).
    await this.runPublicationSimulation(params, "retry");

    await this.syncListingStatusFromWebsite(params);
    return { ok: true };
  }

  async listPublicationLogs(params: { agencyId: string; actor: ActorScope; listingId: string; skip: number; take: number }) {
    const listing = await this.prisma.listing.findFirst({
      where: { id: params.listingId, agencyId: params.agencyId, deletedAt: null, property: { deletedAt: null }, ...listingScopeWhere(params.actor) },
      select: { id: true },
    });
    if (!listing) throw new NotFoundException("Listing not found");

    const [items, total] = await Promise.all([
      this.prisma.publicationLog.findMany({
        where: { agencyId: params.agencyId, listingPublication: { listingId: params.listingId } },
        orderBy: { startedAt: "desc" },
        skip: params.skip,
        take: params.take,
        include: {
          listingPublication: { include: { channel: { select: { code: true, displayName: true } } } },
        },
      }),
      this.prisma.publicationLog.count({ where: { agencyId: params.agencyId, listingPublication: { listingId: params.listingId } } }),
    ]);

    return {
      items: items.map((l) => {
        const payload = l.requestPayload as unknown as Record<string, unknown> | null;
        const action = payload && typeof payload === "object" ? (payload as any).action : null;
        return {
          id: l.id,
          startedAt: l.startedAt,
          finishedAt: l.finishedAt,
          attemptNo: l.attemptNo,
          status: l.status,
          channelCode: (l.listingPublication as any)?.channel?.code ?? null,
          channelDisplayName: (l.listingPublication as any)?.channel?.displayName ?? null,
          action: typeof action === "string" ? action : null,
          message: l.errorMessage ?? null,
        };
      }),
      total,
    };
  }

  private async ensureWebsitePublicationLegacy(params: { agencyId: string; actor: ActorScope; listingId: string }) {
    const channel = await this.prisma.publicationChannel.findFirst({
      where: { agencyId: params.agencyId, code: "WEBSITE" },
      select: { id: true },
    });
    if (!channel) {
      await this.ensureChannelAndMapping({ agencyId: params.agencyId, code: "WEBSITE" });
    }

    const channelRow = await this.prisma.publicationChannel.findFirst({ where: { agencyId: params.agencyId, code: "WEBSITE" }, select: { id: true } });
    if (!channelRow) return;

    const mappingVersion = 1;
    const publication = await this.prisma.listingPublication.findFirst({
      where: { agencyId: params.agencyId, listingId: params.listingId, channelId: channelRow.id },
    });
    if (!publication) {
      const feedMapping = await this.ensureChannelAndMapping({ agencyId: params.agencyId, code: "WEBSITE" });
      await this.prisma.listingPublication.create({
        data: {
          agencyId: params.agencyId,
          listingId: params.listingId,
          channelId: channelRow.id,
          mappingVersion: feedMapping.mappingVersion,
          status: ListingPublicationStatus.SUCCEEDED,
          requestedAt: new Date(),
          publishedAt: new Date(),
          sourceListingUpdatedAt: new Date(),
          externalReference: "legacy-listing-status",
        },
      });
      // Create a minimal log entry for traceability.
      const publicationCreated = await this.prisma.listingPublication.findFirst({
        where: { agencyId: params.agencyId, listingId: params.listingId, channelId: channelRow.id },
        select: { id: true },
      });
      if (publicationCreated) {
        await this.prisma.publicationLog.create({
          data: {
            agencyId: params.agencyId,
            listingPublicationId: publicationCreated.id,
            attemptNo: 1,
            status: PublicationAttemptStatus.SUCCESS,
            startedAt: new Date(),
            finishedAt: new Date(),
            requestPayload: { action: "legacy_publish", channel: "WEBSITE" },
            responsePayload: {},
          },
        });
      }
    } else {
      if (publication.status !== ListingPublicationStatus.SUCCEEDED) {
        await this.prisma.listingPublication.update({
          where: { id: publication.id },
          data: { status: ListingPublicationStatus.SUCCEEDED, publishedAt: new Date() },
        });
      }
    }
  }

  private async ensureChannelAndMapping(params: { agencyId: string; code: PublicationChannelCode }) {
    const config = getPublicationChannelConfig(params.code);
    let channel = await this.prisma.publicationChannel.findFirst({
      where: { agencyId: params.agencyId, code: params.code },
      select: { id: true },
    });
    if (!channel) {
      channel = await this.prisma.publicationChannel.create({
        data: {
          agencyId: params.agencyId,
          channelType: config.channelType,
          code: params.code,
          displayName: config.displayName,
          isEnabled: true,
        },
        select: { id: true },
      });
    }

    const mappingVersion = 1;
    let feedMapping = await this.prisma.feedMapping.findFirst({
      where: { agencyId: params.agencyId, channelId: channel.id, mappingVersion },
    });
    if (!feedMapping) {
      feedMapping = await this.prisma.feedMapping.create({
        data: {
          agencyId: params.agencyId,
          channelId: channel.id,
          mappingVersion,
          adapterCode:
            params.code === "XML_FEED" ? "xml.generic.v1" : params.code === "PORTAL" ? "portal.generic.v1" : "web.generic.v1",
          mapping: {
            channelCode: params.code,
          },
        },
      });
    }
    return feedMapping;
  }

  private async runPublicationSimulation(params: { agencyId: string; actor: ActorScope; actorRole: UserRole; listingId: string; channels: PublicationChannelCode[] }, action: "publish" | "retry") {
    for (const code of params.channels) {
      await this.publishSingleChannel({ agencyId: params.agencyId, listingId: params.listingId, action, code });
    }
  }

  private async publishSingleChannel(params: { agencyId: string; listingId: string; action: "publish" | "retry"; code: PublicationChannelCode }) {
    const feedMapping = await this.ensureChannelAndMapping({ agencyId: params.agencyId, code: params.code });
    const channel = await this.prisma.publicationChannel.findFirst({
      where: { agencyId: params.agencyId, code: params.code },
      select: { id: true },
    });
    if (!channel) throw new BadRequestException("Publication channel missing");

    let publication = await this.prisma.listingPublication.findFirst({
      where: { agencyId: params.agencyId, listingId: params.listingId, channelId: channel.id },
    });

    if (!publication) {
      publication = await this.prisma.listingPublication.create({
        data: {
          agencyId: params.agencyId,
          listingId: params.listingId,
          channelId: channel.id,
          mappingVersion: feedMapping.mappingVersion,
          status: ListingPublicationStatus.QUEUED,
          requestedAt: new Date(),
          sourceListingUpdatedAt: new Date(),
        },
      });
    } else {
      publication = await this.prisma.listingPublication.update({
        where: { id: publication.id },
        data: { status: ListingPublicationStatus.QUEUED, requestedAt: new Date(), sourceListingUpdatedAt: new Date(), publishedAt: null },
      });
    }

    // Determine attemptNo.
    const lastLog = await this.prisma.publicationLog.findFirst({
      where: { agencyId: params.agencyId, listingPublicationId: publication.id },
      orderBy: { attemptNo: "desc" },
      select: { attemptNo: true },
    });
    const attemptNo = (lastLog?.attemptNo ?? 0) + 1;

    const startedAt = new Date();
    await this.prisma.publicationLog.create({
      data: {
        agencyId: params.agencyId,
        listingPublicationId: publication.id,
        attemptNo,
        status: PublicationAttemptStatus.STARTED,
        startedAt,
        requestPayload: { action: params.action, channelCode: params.code },
      },
    });

    await this.prisma.listingPublication.update({
      where: { id: publication.id },
      data: { status: params.action === "retry" ? ListingPublicationStatus.RETRYING : ListingPublicationStatus.PROCESSING },
    });

    // Simulated adapter processing:
    // - WEBSITE / XML_FEED: succeed always
    // - PORTAL: fail first attempt, succeed on retry (attemptNo >= 2)
    const shouldFail = params.code === "PORTAL" && attemptNo === 1 && params.action === "publish";

    if (shouldFail) {
      const errorMessage = "Portal adapter not wired yet (simulated). Retry to attempt again.";
      await this.prisma.publicationLog.updateMany({
        where: { agencyId: params.agencyId, listingPublicationId: publication.id, attemptNo, status: PublicationAttemptStatus.STARTED },
        data: { status: PublicationAttemptStatus.FAILED, finishedAt: new Date(), errorMessage },
      });
      await this.prisma.listingPublication.update({
        where: { id: publication.id },
        data: { status: ListingPublicationStatus.FAILED },
      });
    } else {
      await this.prisma.publicationLog.updateMany({
        where: { agencyId: params.agencyId, listingPublicationId: publication.id, attemptNo, status: PublicationAttemptStatus.STARTED },
        data: {
          status: PublicationAttemptStatus.SUCCESS,
          finishedAt: new Date(),
          errorMessage: null,
          responsePayload: { ok: true },
        },
      });
      await this.prisma.listingPublication.update({
        where: { id: publication.id },
        data: { status: ListingPublicationStatus.SUCCEEDED, publishedAt: new Date(), externalReference: params.action },
      });
    }
  }

  private async cancelChannelPublication(params: { agencyId: string; listingId: string; code: PublicationChannelCode }) {
    const channel = await this.prisma.publicationChannel.findFirst({ where: { agencyId: params.agencyId, code: params.code }, select: { id: true } });
    if (!channel) return;
    const publication = await this.prisma.listingPublication.findFirst({
      where: { agencyId: params.agencyId, listingId: params.listingId, channelId: channel.id },
      select: { id: true },
    });
    if (!publication) return;
    await this.prisma.listingPublication.update({
      where: { id: publication.id },
      data: { status: ListingPublicationStatus.CANCELLED, publishedAt: null },
    });
  }

  private async syncListingStatusFromWebsite(params: { agencyId: string; actor: ActorScope; actorRole: UserRole; listingId: string }) {
    const channel = await this.prisma.publicationChannel.findFirst({ where: { agencyId: params.agencyId, code: "WEBSITE" }, select: { id: true } });
    if (!channel) {
      // No channel record yet; leave listing.status as-is.
      return;
    }
    const website = await this.prisma.listingPublication.findFirst({
      where: { agencyId: params.agencyId, listingId: params.listingId, channelId: channel.id, status: ListingPublicationStatus.SUCCEEDED },
      select: { id: true },
    });
    if (website) {
      await this.prisma.listing.update({
        where: { id: params.listingId },
        data: { status: ListingStatus.ACTIVE },
      });
    } else {
      await this.prisma.listing.update({
        where: { id: params.listingId },
        data: { status: ListingStatus.DRAFT },
      });
    }
  }
}

