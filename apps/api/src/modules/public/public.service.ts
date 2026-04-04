import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client } from "@aws-sdk/client-s3";
import type { SearchListingsQueryDto } from "./dto/search-listings.query.dto";
import type { CreateInquiryDto } from "./dto/inquiry.dto";
import { InquirySource, InquiryStatus, InquiryPreferredContactMethod, ListingStatus, ListingType } from "@prisma/client";
import { NotificationsService } from "../collaboration/notifications.service";
import { NotificationType, UserRole } from "@prisma/client";
import { TurnstileService } from "../../common/turnstile/turnstile.service";

function limitInt(value: number | undefined, fallback: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return value;
}

function normalizeLang(lang?: string | null) {
  if (!lang) return "en";
  const v = lang.trim().toLowerCase();
  if (!/^[a-z]{2}(-[a-z]{2})?$/.test(v)) return "en";
  return v;
}

@Injectable()
export class PublicService {
  private readonly s3: S3Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly turnstile: TurnstileService,
  ) {
    const endpoint = process.env.S3_ENDPOINT;
    const region = process.env.S3_REGION ?? "us-east-1";
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    this.s3 = new S3Client({
      endpoint,
      region,
      credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
      forcePathStyle: true,
    });
  }

  private async getAgencyId(agencySlug: string) {
    const agency = await this.prisma.agency.findUnique({
      where: { slug: agencySlug },
      select: { id: true },
    });
    if (!agency) throw new NotFoundException("Agency not found");
    return agency.id;
  }

  private async signedMediaUrl(storageKey: string) {
    const base = process.env.S3_PUBLIC_BASE_URL;
    if (base && base.length > 0) {
      // If you use a public bucket/CDN, this avoids per-request signing.
      return `${base.replace(/\/$/, "")}/${storageKey.replace(/^\//, "")}`;
    }

    const endpoint = process.env.S3_ENDPOINT;
    const bucket = process.env.S3_BUCKET;
    if (!endpoint || !bucket) return null;

    const signedUrlTtlSeconds = Number(process.env.S3_SIGNED_URL_TTL_SECONDS ?? 3600);
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: storageKey });
    return getSignedUrl(this.s3, cmd, { expiresIn: signedUrlTtlSeconds });
  }

  private publishedListingWhere(agencyId: string) {
    return {
      agencyId,
      status: ListingStatus.ACTIVE,
      deletedAt: null,
      property: { deletedAt: null },
    };
  }

  private resolveListingLanguageContent<T extends { title: string; description: string; originalLanguageCode?: string | null; translations?: Array<{ languageCode: string; title: string; description: string; shortDescription?: string | null }> }>(
    listing: T,
    lang?: string,
  ) {
    const requested = normalizeLang(lang);
    const original = (listing.originalLanguageCode ?? "en").toLowerCase();
    if (requested === original) {
      return { languageCode: original, title: listing.title, description: listing.description, shortDescription: null };
    }
    const tr = listing.translations?.find((t) => t.languageCode.toLowerCase() === requested);
    if (tr) {
      return { languageCode: requested, title: tr.title, description: tr.description, shortDescription: tr.shortDescription ?? null };
    }
    return { languageCode: original, title: listing.title, description: listing.description, shortDescription: null };
  }

  async searchListings(agencySlug: string, query: SearchListingsQueryDto) {
    const agencyId = await this.getAgencyId(agencySlug);

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where: any = this.publishedListingWhere(agencyId);

    if (query.listingType) where.listingType = query.listingType;
    if (typeof query.minPrice === "number") where.price = { ...(where.price ?? {}), gte: query.minPrice };
    if (typeof query.maxPrice === "number") where.price = { ...(where.price ?? {}), lte: query.maxPrice };
    if (typeof query.bedrooms === "number") where.bedrooms = query.bedrooms;
    if (query.city) where.property = { ...(where.property ?? {}), city: { equals: query.city } };
    if (query.area) where.property = { ...(where.property ?? {}), area: { equals: query.area } };

    if (query.city && !query.area) {
      // still allow broader matches if area isn't provided
      where.property = { ...(where.property ?? {}), city: { contains: query.city, mode: "insensitive" } };
    }

    const [items, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          translations: {
            where: { languageCode: normalizeLang(query.lang) },
            select: { languageCode: true, title: true, description: true, shortDescription: true },
          },
          property: {
            select: {
              id: true,
              address: true,
              city: true,
              area: true,
              latitude: true,
              longitude: true,
            },
          },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    // Load cover images in batch
    const listingIds = items.map((i) => i.id);
    const covers = await this.prisma.mediaAsset.findMany({
      where: {
        agencyId,
        listingId: { in: listingIds },
        deletedAt: null,
        uploadStatus: "ACTIVE",
        mediaType: "IMAGE",
        isCover: true,
      },
      select: { listingId: true, storageKey: true },
    });
    const coverMap = new Map(covers.map((c) => [c.listingId, c.storageKey]));

    return {
      items: await Promise.all(
        items.map(async (l) => {
          const content = this.resolveListingLanguageContent(l as any, query.lang);
          const storageKey = coverMap.get(l.id);
          return {
            id: l.id,
            slug: l.slug,
            languageCode: content.languageCode,
            title: content.title,
            shortDescription: content.shortDescription,
            listingType: l.listingType,
            price: l.price,
            currency: l.currency,
            bedrooms: l.bedrooms,
            bathrooms: l.bathrooms,
            sqm: l.sqm,
            property: l.property,
            cover: storageKey ? { storageKey, url: await this.signedMediaUrl(storageKey) } : null,
          };
        }),
      ),
      pageInfo: { page, pageSize, total, hasNextPage: skip + items.length < total },
    };
  }

  async getListingDetail(agencySlug: string, listingSlug: string, lang?: string) {
    const agencyId = await this.getAgencyId(agencySlug);

    const listing = await this.prisma.listing.findFirst({
      where: {
        ...this.publishedListingWhere(agencyId),
        slug: listingSlug,
      },
      include: {
        translations: {
          where: { languageCode: normalizeLang(lang) },
          select: { languageCode: true, title: true, description: true, shortDescription: true },
        },
        property: {
          include: { ownerContact: true },
        },
      },
    });

    if (!listing) throw new NotFoundException("Listing not found");

    const cover = await this.prisma.mediaAsset.findFirst({
      where: {
        agencyId,
        listingId: listing.id,
        deletedAt: null,
        uploadStatus: "ACTIVE",
        mediaType: "IMAGE",
        isCover: true,
      },
      select: { storageKey: true, mimeType: true, fileName: true },
    });

    const gallery = await this.prisma.mediaAsset.findMany({
      where: {
        agencyId,
        listingId: listing.id,
        deletedAt: null,
        uploadStatus: "ACTIVE",
        mediaType: "IMAGE",
      },
      orderBy: { sortOrder: "asc" },
      take: 12,
      select: { storageKey: true, mimeType: true, fileName: true, sortOrder: true, isCover: true },
    });

    const content = this.resolveListingLanguageContent(listing as any, lang);
    return {
      id: listing.id,
      slug: listing.slug,
      languageCode: content.languageCode,
      title: content.title,
      description: content.description,
      shortDescription: content.shortDescription,
      listingType: listing.listingType,
      status: listing.status,
      price: listing.price,
      currency: listing.currency,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      sqm: listing.sqm,
      property: {
        id: listing.property.id,
        address: listing.property.address,
        city: listing.property.city,
        area: listing.property.area,
        latitude: listing.property.latitude,
        longitude: listing.property.longitude,
        owner: {
          id: listing.property.ownerContact.id,
          firstName: listing.property.ownerContact.firstName,
          lastName: listing.property.ownerContact.lastName,
          organizationName: listing.property.ownerContact.organizationName,
        },
      },
      cover: cover ? { storageKey: cover.storageKey, url: await this.signedMediaUrl(cover.storageKey) } : null,
      gallery: await Promise.all(
        gallery.map(async (g) => ({
          storageKey: g.storageKey,
          url: await this.signedMediaUrl(g.storageKey),
          sortOrder: g.sortOrder,
          isCover: g.isCover,
          mimeType: g.mimeType,
          fileName: g.fileName,
        })),
      ),
    };
  }

  async getSimilarListings(agencySlug: string, listingSlug: string, limit: number, lang?: string) {
    const agencyId = await this.getAgencyId(agencySlug);

    const base = await this.prisma.listing.findFirst({
      where: { ...this.publishedListingWhere(agencyId), slug: listingSlug },
      include: { property: true },
    });
    if (!base) throw new NotFoundException("Listing not found");

    const where: any = {
      ...this.publishedListingWhere(agencyId),
      id: { not: base.id },
      listingType: base.listingType,
    };

    if (base.property.city) where.property = { ...(where.property ?? {}), city: { contains: base.property.city, mode: "insensitive" } };
    if (base.property.area) where.property = { ...(where.property ?? {}), area: { equals: base.property.area } };
    if (base.bedrooms != null) where.bedrooms = base.bedrooms;

    const items = await this.prisma.listing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        translations: {
          where: { languageCode: normalizeLang(lang) },
          select: { languageCode: true, title: true, description: true, shortDescription: true },
        },
        property: {
          select: { id: true, address: true, city: true, area: true },
        },
      },
    });

    const coverRows = await this.prisma.mediaAsset.findMany({
      where: {
        agencyId,
        listingId: { in: items.map((i) => i.id) },
        deletedAt: null,
        uploadStatus: "ACTIVE",
        mediaType: "IMAGE",
        isCover: true,
      },
      select: { listingId: true, storageKey: true },
    });
    const coverMap = new Map(coverRows.map((c) => [c.listingId, c.storageKey]));

    return {
      items: await Promise.all(
        items.map(async (l) => {
          const content = this.resolveListingLanguageContent(l as any, lang);
          const storageKey = coverMap.get(l.id);
          return {
            id: l.id,
            slug: l.slug,
            languageCode: content.languageCode,
            title: content.title,
            listingType: l.listingType,
            price: l.price,
            currency: l.currency,
            bedrooms: l.bedrooms,
            property: l.property,
            cover: storageKey ? { storageKey, url: await this.signedMediaUrl(storageKey) } : null,
          };
        }),
      ),
    };
  }

  async getXmlFeed(agencySlug: string, lang?: string) {
    const agencyId = await this.getAgencyId(agencySlug);
    const normalizedLang = lang ? normalizeLang(lang) : null;
    const listings = await this.prisma.listing.findMany({
      where: this.publishedListingWhere(agencyId),
      include: {
        translations: normalizedLang
          ? {
              where: { languageCode: normalizedLang },
              select: { languageCode: true, title: true, description: true, shortDescription: true },
            }
          : {
              select: { languageCode: true, title: true, description: true, shortDescription: true },
            },
        property: {
          select: { address: true, city: true, area: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 2000,
    });

    // MVP choice: one <listing> entry per language version.
    const rows: Array<any> = [];
    for (const l of listings as any[]) {
      const originalLang = (l.originalLanguageCode ?? "en").toLowerCase();
      if (!normalizedLang || normalizedLang === originalLang) {
        rows.push({
          id: l.id,
          slug: l.slug,
          languageCode: originalLang,
          title: l.title,
          description: l.description,
          shortDescription: null,
          listingType: l.listingType,
          status: l.status,
          price: l.price,
          currency: l.currency,
          bedrooms: l.bedrooms,
          bathrooms: l.bathrooms,
          sqm: l.sqm,
          property: l.property,
        });
      }
      for (const tr of l.translations ?? []) {
        if (normalizedLang && tr.languageCode.toLowerCase() !== normalizedLang) continue;
        rows.push({
          id: l.id,
          slug: l.slug,
          languageCode: tr.languageCode.toLowerCase(),
          title: tr.title,
          description: tr.description,
          shortDescription: tr.shortDescription ?? null,
          listingType: l.listingType,
          status: l.status,
          price: l.price,
          currency: l.currency,
          bedrooms: l.bedrooms,
          bathrooms: l.bathrooms,
          sqm: l.sqm,
          property: l.property,
        });
      }
    }

    const esc = (v: unknown) =>
      String(v ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

    const xml = [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<listings agency="${esc(agencySlug)}" generatedAt="${new Date().toISOString()}">`,
      ...rows.map(
        (r) => `<listing id="${esc(r.id)}" slug="${esc(r.slug)}" language="${esc(r.languageCode)}">
  <title>${esc(r.title)}</title>
  <description>${esc(r.description)}</description>
  <shortDescription>${esc(r.shortDescription ?? "")}</shortDescription>
  <listingType>${esc(r.listingType)}</listingType>
  <status>${esc(r.status)}</status>
  <price currency="${esc(r.currency ?? "")}">${esc(r.price ?? "")}</price>
  <bedrooms>${esc(r.bedrooms ?? "")}</bedrooms>
  <bathrooms>${esc(r.bathrooms ?? "")}</bathrooms>
  <sqm>${esc(r.sqm ?? "")}</sqm>
  <address>${esc(r.property?.address ?? "")}</address>
  <city>${esc(r.property?.city ?? "")}</city>
  <area>${esc(r.property?.area ?? "")}</area>
</listing>`,
      ),
      `</listings>`,
    ].join("\n");

    return { contentType: "application/xml; charset=utf-8", xml, itemCount: rows.length, language: normalizedLang ?? "all" };
  }

  async createInquiry(
    agencySlug: string,
    listingSlug: string,
    dto: CreateInquiryDto,
    remoteIp?: string,
  ) {
    const agencyId = await this.getAgencyId(agencySlug);

    const listing = await this.prisma.listing.findFirst({
      where: {
        ...this.publishedListingWhere(agencyId),
        slug: listingSlug,
      },
      select: { id: true },
    });
    if (!listing) throw new NotFoundException("Listing not found");

    await this.turnstile.assertValidResponse("inquiry", dto.turnstileToken, remoteIp);

    // Minimal validation: either email or phone should be present
    if (!dto.email && !dto.phone) {
      throw new BadRequestException("Provide at least email or phone");
    }

    const inquiry = await this.prisma.inquiry.create({
      data: {
        agencyId,
        listingId: listing.id,
        source: InquirySource.WEBSITE_FORM,
        status: InquiryStatus.NEW,
        name: dto.name.trim(),
        email: dto.email ? dto.email.toLowerCase() : null,
        phone: dto.phone ?? null,
        message: dto.message ?? null,
        preferredContactMethod: dto.preferredContactMethod ?? null,
      },
    });

    // Notify owners/managers (MVP) about new inbound inquiry.
    const recipients = await this.prisma.agencyMembership.findMany({
      where: { agencyId, role: { in: [UserRole.OWNER, UserRole.MANAGER] } },
      select: { id: true },
      take: 50,
    });
    await Promise.all(
      recipients.map((m) =>
        this.notifications.create({
          agencyId,
          membershipId: m.id,
          type: NotificationType.INQUIRY_RECEIVED,
          title: "New inquiry received",
          body: dto.message ? String(dto.message).slice(0, 220) : `${dto.name} submitted an inquiry`,
          inquiryId: inquiry.id,
          listingId: listing.id,
        }),
      ),
    );

    return inquiry;
  }
}

