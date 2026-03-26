import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ListingStatus, ListingType, Prisma, TranslationReviewStatus, TranslationSource } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import { hasFullAgencyDataScope } from "../../auth/rbac.constants";
import type { ActorScope } from "../../auth/rbac-query.util";
import { listingScopeWhere, propertyScopeWhere } from "../../auth/rbac-query.util";

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {}

  private slugify(input: string) {
    const base = input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    return base.length > 0 ? base : "listing";
  }

  async create(params: {
    agencyId: string;
    actor: ActorScope;
    actorMembershipId?: string;
    data: {
      propertyId: string;
      listingType: ListingType;
      status?: ListingStatus;
      title: string;
      description: string;
      descriptionEl?: string;
      price?: number;
      currency?: string;
      bedrooms?: number;
      bathrooms?: number;
      sqm?: number;
    };
  }) {
    const property = await this.prisma.property.findFirst({
      where: { id: params.data.propertyId, agencyId: params.agencyId, deletedAt: null, ...propertyScopeWhere(params.actor) },
      select: { id: true },
    });
    if (!property) throw new BadRequestException("Invalid propertyId");

    if (!hasFullAgencyDataScope(params.actor.role)) {
      if (params.data.status && params.data.status !== ListingStatus.DRAFT) {
        throw new ForbiddenException("Only Owners and Managers can publish listings");
      }
    }

    const baseSlug = this.slugify(params.data.title);
    let slug = baseSlug;
    for (let i = 0; i < 20; i++) {
      const exists = await this.prisma.listing.findFirst({
        where: { agencyId: params.agencyId, slug },
        select: { id: true },
      });
      if (!exists) break;
      slug = `${baseSlug}-${i + 1}`;
    }

    const listing = await this.prisma.listing.create({
      data: {
        agencyId: params.agencyId,
        propertyId: params.data.propertyId,
        listingType: params.data.listingType,
        status: params.data.status ?? ListingStatus.DRAFT,
        title: params.data.title,
        slug,
        description: params.data.description,
        descriptionEl: params.data.descriptionEl ?? undefined,
        originalLanguageCode: "en",
        price: params.data.price ?? undefined,
        currency: params.data.currency ?? undefined,
        bedrooms: params.data.bedrooms ?? undefined,
        bathrooms: params.data.bathrooms ?? undefined,
        sqm: params.data.sqm ?? undefined,
        createdByMembershipId: params.actorMembershipId,
      },
    });

    return listing;
  }

  async list(params: {
    agencyId: string;
    actor: ActorScope;
    listingType?: ListingType;
    status?: ListingStatus;
    ownerContactId?: string;
    minPrice?: number;
    maxPrice?: number;
    q?: string;
    bedrooms?: number;
    skip: number;
    take: number;
  }) {
    const where: Prisma.ListingWhereInput = {
      agencyId: params.agencyId,
      deletedAt: null,
      property: {
        deletedAt: null,
        ...(params.ownerContactId ? { ownerContactId: params.ownerContactId } : {}),
      },
      ...listingScopeWhere(params.actor),
    };

    if (params.listingType) where.listingType = params.listingType;
    if (params.status) where.status = params.status;
    if (typeof params.minPrice === "number" || typeof params.maxPrice === "number") {
      where.price = {
        ...(typeof params.minPrice === "number" ? { gte: params.minPrice } : {}),
        ...(typeof params.maxPrice === "number" ? { lte: params.maxPrice } : {}),
      };
    }
    if (typeof params.bedrooms === "number") where.bedrooms = params.bedrooms;

    if (params.q) {
      const q = params.q.trim();
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: params.skip,
        take: params.take,
        include: {
          property: {
            select: {
              id: true,
              address: true,
              ownerContactId: true,
              ownerContact: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  organizationName: true,
                  email: true,
                },
              },
            },
          },
          translations: {
            select: { languageCode: true, reviewStatus: true, translatedAt: true },
          },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return { items, total };
  }

  async get(params: { agencyId: string; actor: ActorScope; id: string }) {
    const listing = await this.prisma.listing.findFirst({
      where: {
        id: params.id,
        agencyId: params.agencyId,
        deletedAt: null,
        property: { deletedAt: null },
        ...listingScopeWhere(params.actor),
      },
      include: {
        property: {
          include: {
            ownerContact: { select: { id: true, firstName: true, lastName: true, organizationName: true, email: true } },
          },
        },
        translations: {
          select: {
            id: true,
            languageCode: true,
            title: true,
            description: true,
            shortDescription: true,
            translatedBy: true,
            translatedAt: true,
            reviewStatus: true,
            reviewedAt: true,
          },
          orderBy: { languageCode: "asc" },
        },
      },
    });
    if (!listing) throw new NotFoundException("Listing not found");
    return listing;
  }

  async update(params: {
    agencyId: string;
    actor: ActorScope;
    actorMembershipId?: string;
    id: string;
    data: {
      status?: ListingStatus;
      title?: string;
      description?: string;
      descriptionEl?: string;
      price?: number | null;
      currency?: string | null;
      bedrooms?: number | null;
      bathrooms?: number | null;
      sqm?: number | null;
    };
  }) {
    const existing = await this.prisma.listing.findFirst({
      where: { id: params.id, agencyId: params.agencyId, deletedAt: null, ...listingScopeWhere(params.actor) },
      select: { id: true, status: true },
    });
    if (!existing) throw new NotFoundException("Listing not found");

    if (!hasFullAgencyDataScope(params.actor.role)) {
      if (existing.status !== ListingStatus.DRAFT) {
        throw new ForbiddenException("Only draft listings can be edited");
      }
      if (params.data.status != null && params.data.status !== ListingStatus.DRAFT) {
        throw new ForbiddenException("Only Owners and Managers can publish listings");
      }
    }

    const listing = await this.prisma.listing.update({
      where: { id: existing.id },
      data: {
        status: params.data.status ?? undefined,
        title: params.data.title ?? undefined,
        description: params.data.description ?? undefined,
        descriptionEl: params.data.descriptionEl ?? undefined,
        price: params.data.price === null ? null : params.data.price ?? undefined,
        currency: params.data.currency === null ? null : params.data.currency ?? undefined,
        bedrooms: params.data.bedrooms === null ? null : params.data.bedrooms ?? undefined,
        bathrooms: params.data.bathrooms === null ? null : params.data.bathrooms ?? undefined,
        sqm: params.data.sqm === null ? null : params.data.sqm ?? undefined,
      },
    });

    return this.get({ agencyId: params.agencyId, actor: params.actor, id: listing.id });
  }

  async softDelete(params: { agencyId: string; actor: ActorScope; actorMembershipId?: string; id: string }) {
    const existing = await this.prisma.listing.findFirst({
      where: { id: params.id, agencyId: params.agencyId, deletedAt: null, ...listingScopeWhere(params.actor) },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException("Listing not found");

    await this.prisma.listing.update({
      where: { id: existing.id },
      data: {
        deletedAt: new Date(),
        deletedByMembershipId: params.actorMembershipId ?? null,
      },
    });

    return { ok: true };
  }

  async createInternalNote(params: {
    agencyId: string;
    actor: ActorScope;
    actorMembershipId?: string;
    listingId: string;
    content: string;
  }) {
    const listing = await this.prisma.listing.findFirst({
      where: { id: params.listingId, agencyId: params.agencyId, deletedAt: null, ...listingScopeWhere(params.actor) },
      select: { id: true },
    });
    if (!listing) throw new NotFoundException("Listing not found");

    return this.prisma.listingInternalNote.create({
      data: {
        agencyId: params.agencyId,
        listingId: params.listingId,
        content: params.content,
        createdByMembershipId: params.actorMembershipId ?? null,
      },
    });
  }

  async listInternalNotes(params: {
    agencyId: string;
    actor: ActorScope;
    listingId: string;
    skip: number;
    take: number;
  }) {
    const listing = await this.prisma.listing.findFirst({
      where: { id: params.listingId, agencyId: params.agencyId, deletedAt: null, ...listingScopeWhere(params.actor) },
      select: { id: true },
    });
    if (!listing) throw new NotFoundException("Listing not found");

    const where = { agencyId: params.agencyId, listingId: params.listingId };

    const [items, total] = await Promise.all([
      this.prisma.listingInternalNote.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.listingInternalNote.count({ where }),
    ]);

    return { items, total };
  }

  async deleteInternalNote(params: { agencyId: string; actor: ActorScope; listingId: string; noteId: string }) {
    const listing = await this.prisma.listing.findFirst({
      where: { id: params.listingId, agencyId: params.agencyId, deletedAt: null, ...listingScopeWhere(params.actor) },
      select: { id: true },
    });
    if (!listing) throw new NotFoundException("Listing not found");

    const existing = await this.prisma.listingInternalNote.findFirst({
      where: { id: params.noteId, agencyId: params.agencyId, listingId: params.listingId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException("Internal note not found");

    await this.prisma.listingInternalNote.delete({ where: { id: existing.id } });
    return { ok: true };
  }

  async listTranslations(params: { agencyId: string; actor: ActorScope; listingId: string }) {
    const listing = await this.prisma.listing.findFirst({
      where: { id: params.listingId, agencyId: params.agencyId, deletedAt: null, ...listingScopeWhere(params.actor) },
      select: { id: true, title: true, description: true, originalLanguageCode: true },
    });
    if (!listing) throw new NotFoundException("Listing not found");

    const items = await this.prisma.listingContentTranslation.findMany({
      where: { agencyId: params.agencyId, listingId: params.listingId },
      orderBy: { languageCode: "asc" },
    });

    return {
      original: {
        languageCode: listing.originalLanguageCode || "en",
        title: listing.title,
        description: listing.description,
      },
      items,
    };
  }

  async upsertTranslation(params: {
    agencyId: string;
    actor: ActorScope;
    actorMembershipId?: string;
    listingId: string;
    languageCode: string;
    title: string;
    description: string;
    shortDescription?: string;
    reviewStatus?: TranslationReviewStatus;
  }) {
    const listing = await this.prisma.listing.findFirst({
      where: { id: params.listingId, agencyId: params.agencyId, deletedAt: null, ...listingScopeWhere(params.actor) },
      select: { id: true, originalLanguageCode: true },
    });
    if (!listing) throw new NotFoundException("Listing not found");

    const code = params.languageCode.trim().toLowerCase();
    if (!/^[a-z]{2}(-[a-z]{2})?$/.test(code)) throw new BadRequestException("Invalid language code");
    if (code === (listing.originalLanguageCode || "en")) throw new BadRequestException("Use listing base fields for original language");

    return this.prisma.listingContentTranslation.upsert({
      where: {
        agencyId_listingId_languageCode: {
          agencyId: params.agencyId,
          listingId: params.listingId,
          languageCode: code,
        },
      },
      create: {
        agencyId: params.agencyId,
        listingId: params.listingId,
        languageCode: code,
        title: params.title.trim(),
        description: params.description.trim(),
        shortDescription: params.shortDescription?.trim() || null,
        translatedBy: TranslationSource.HUMAN,
        translatedAt: new Date(),
        reviewStatus: params.reviewStatus ?? TranslationReviewStatus.REVIEWED,
        reviewedAt: params.reviewStatus ? new Date() : null,
        reviewedByMembershipId: params.reviewStatus ? params.actorMembershipId ?? null : null,
        createdByMembershipId: params.actorMembershipId ?? null,
      },
      update: {
        title: params.title.trim(),
        description: params.description.trim(),
        shortDescription: params.shortDescription?.trim() || null,
        translatedBy: TranslationSource.HUMAN,
        translatedAt: new Date(),
        reviewStatus: params.reviewStatus ?? TranslationReviewStatus.REVIEWED,
        reviewedAt: params.reviewStatus ? new Date() : null,
        reviewedByMembershipId: params.reviewStatus ? params.actorMembershipId ?? null : null,
      },
    });
  }
}

