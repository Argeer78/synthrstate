import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { MediaType, MediaUploadStatus } from "@prisma/client";
import { randomUUID } from "crypto";

type CreateSignedImageUploadParams = {
  agencyId: string;
  listingId: string;
  actorMembershipId?: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
};

@Injectable()
export class MediaService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly signedUrlTtlSeconds: number;
  private readonly maxImageBytes: number;

  constructor(private readonly prisma: PrismaService) {
    const endpoint = process.env.S3_ENDPOINT;
    const region = process.env.S3_REGION ?? "us-east-1";
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    this.bucket = process.env.S3_BUCKET ?? "CHANGE_ME_BUCKET";
    this.signedUrlTtlSeconds = Number(process.env.S3_SIGNED_URL_TTL_SECONDS ?? 600);
    this.maxImageBytes = Number(process.env.MEDIA_MAX_IMAGE_BYTES ?? 10 * 1024 * 1024);

    if (!endpoint || !accessKeyId || !secretAccessKey) {
      // Keep production-lean: only fail when used.
      // eslint-disable-next-line no-console
      console.warn("S3 env vars are not set; media upload will fail until configured.");
    }

    this.s3 = new S3Client({
      endpoint: endpoint,
      region,
      credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
      forcePathStyle: true,
    });
  }

  private assertImageAllowed(contentType: string, sizeBytes: number) {
    const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
    if (!allowed.has(contentType)) throw new BadRequestException("Unsupported image contentType");
    if (sizeBytes > this.maxImageBytes) throw new BadRequestException("Image is too large");
  }

  private sanitizeFileName(fileName: string) {
    // avoid weird chars in key; keep it simple for MVP
    return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  }

  private listingMustBelongToAgency(agencyId: string, listingId: string) {
    return this.prisma.listing.findFirst({
      where: { id: listingId, agencyId, deletedAt: null },
      select: { id: true },
    });
  }

  async listListingMedia(params: {
    agencyId: string;
    listingId: string;
    skip: number;
    take: number;
    includeDeleted: boolean;
    onlyActiveUploads: boolean;
    mediaType?: MediaType;
  }) {
    // Ensure listing belongs to tenant
    const listing = await this.prisma.listing.findFirst({
      where: { id: params.listingId, agencyId: params.agencyId, deletedAt: null },
      select: { id: true },
    });
    if (!listing) throw new NotFoundException("Listing not found");

    const where: any = {
      agencyId: params.agencyId,
      listingId: params.listingId,
      mediaType: params.mediaType ?? "IMAGE",
    };

    if (!params.includeDeleted) where.deletedAt = null;
    if (params.onlyActiveUploads) where.uploadStatus = "ACTIVE";

    const [items, total] = await Promise.all([
      this.prisma.mediaAsset.findMany({
        where,
        orderBy: { sortOrder: "asc" },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.mediaAsset.count({ where }),
    ]);

    return { items, total };
  }

  async createSignedImageUpload(params: CreateSignedImageUploadParams) {
    this.assertImageAllowed(params.contentType, params.sizeBytes);

    const listing = await this.listingMustBelongToAgency(params.agencyId, params.listingId);
    if (!listing) throw new NotFoundException("Listing not found");

    const existingActive = await this.prisma.mediaAsset.findMany({
      where: { agencyId: params.agencyId, listingId: params.listingId, mediaType: "IMAGE", deletedAt: null, uploadStatus: "ACTIVE" },
      select: { id: true, sortOrder: true, isCover: true },
      orderBy: { sortOrder: "desc" },
      take: 1,
    });

    const nextSortOrder = existingActive[0]?.sortOrder != null ? existingActive[0].sortOrder + 1 : 0;

    // If there is no cover yet, make first successful upload the cover.
    const hasCover = await this.prisma.mediaAsset.findFirst({
      where: { agencyId: params.agencyId, listingId: params.listingId, mediaType: "IMAGE", deletedAt: null, uploadStatus: "ACTIVE", isCover: true },
      select: { id: true },
    });
    const willBeCover = !hasCover;

    const sanitized = this.sanitizeFileName(params.fileName);
    const id = randomUUID();
    const storageKey = `agencies/${params.agencyId}/listings/${params.listingId}/media/${id}-${sanitized}`;

    const created = await this.prisma.mediaAsset.create({
      data: {
        id,
        agencyId: params.agencyId,
        listingId: params.listingId,
        mediaType: "IMAGE",
        uploadStatus: MediaUploadStatus.UPLOADING,
        storageKey,
        fileName: params.fileName,
        mimeType: params.contentType,
        sizeBytes: params.sizeBytes,
        sortOrder: nextSortOrder,
        isCover: willBeCover,
        createdByMembershipId: params.actorMembershipId ?? null,
      },
    });

    const endpoint = process.env.S3_ENDPOINT;
    if (!endpoint || !process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) {
      throw new BadRequestException("Media storage is not configured");
    }

    const cmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
      ContentType: params.contentType,
      ContentLength: params.sizeBytes,
    });

    const uploadUrl = await getSignedUrl(this.s3, cmd, { expiresIn: this.signedUrlTtlSeconds });

    return {
      mediaAsset: created,
      uploadUrl,
      expiresInSeconds: this.signedUrlTtlSeconds,
    };
  }

  async completeUpload(params: { agencyId: string; listingId: string; assetId: string; etag?: string }) {
    const asset = await this.prisma.mediaAsset.findFirst({
      where: { id: params.assetId, agencyId: params.agencyId, listingId: params.listingId },
    });
    if (!asset || asset.deletedAt) throw new NotFoundException("Media asset not found");
    if (asset.uploadStatus !== "UPLOADING") throw new BadRequestException("Upload is not in progress");

    // Security lean: we don't re-validate actual image bytes; basic validation already happened at presign time.
    // A future worker can verify dimensions and thumbnails.
    await this.prisma.mediaAsset.update({
      where: { id: asset.id },
      data: {
        uploadStatus: "ACTIVE",
        uploadedAt: new Date(),
        // isCover stays as created; but if it isCover=true and another cover exists, enforce single cover.
      },
    });

    if (asset.isCover) {
      // Ensure single cover per listing
      await this.prisma.mediaAsset.updateMany({
        where: {
          agencyId: params.agencyId,
          listingId: params.listingId,
          mediaType: "IMAGE",
          deletedAt: null,
          uploadStatus: "ACTIVE",
          id: { not: asset.id },
          isCover: true,
        },
        data: { isCover: false },
      });
    }

    return { ok: true };
  }

  async softDeleteMedia(params: { agencyId: string; listingId: string; assetId: string; actorMembershipId?: string }) {
    const asset = await this.prisma.mediaAsset.findFirst({
      where: { id: params.assetId, agencyId: params.agencyId, listingId: params.listingId, deletedAt: null },
      select: { id: true, isCover: true, mediaType: true },
    });
    if (!asset) throw new NotFoundException("Media asset not found");

    await this.prisma.mediaAsset.update({
      where: { id: asset.id },
      data: { deletedAt: new Date(), deletedByMembershipId: params.actorMembershipId ?? null },
    });

    if (asset.isCover) {
      // Pick next cover among remaining active images
      const next = await this.prisma.mediaAsset.findFirst({
        where: { agencyId: params.agencyId, listingId: params.listingId, deletedAt: null, uploadStatus: "ACTIVE", mediaType: asset.mediaType },
        orderBy: { sortOrder: "asc" },
      });
      if (next) {
        await this.prisma.mediaAsset.update({ where: { id: next.id }, data: { isCover: true } });
      }
    }

    return { ok: true };
  }

  async reorderListingMedia(params: { agencyId: string; listingId: string; orderedAssetIds: string[] }) {
    const listing = await this.prisma.listing.findFirst({
      where: { id: params.listingId, agencyId: params.agencyId, deletedAt: null },
      select: { id: true },
    });
    if (!listing) throw new NotFoundException("Listing not found");

    const assets = await this.prisma.mediaAsset.findMany({
      where: { agencyId: params.agencyId, listingId: params.listingId, deletedAt: null, uploadStatus: "ACTIVE", id: { in: params.orderedAssetIds } },
      select: { id: true },
    });

    const assetIds = new Set(assets.map((a) => a.id));
    const unknown = params.orderedAssetIds.filter((id) => !assetIds.has(id));
    if (unknown.length > 0) throw new BadRequestException("orderedAssetIds contains unknown assets");

    await this.prisma.$transaction(async (tx) => {
      // update each asset sortOrder in order
      for (let i = 0; i < params.orderedAssetIds.length; i++) {
        await tx.mediaAsset.update({
          where: { id: params.orderedAssetIds[i] },
          data: { sortOrder: i },
        });
      }
    });

    return { ok: true };
  }

  async setListingCover(params: { agencyId: string; listingId: string; assetId: string; isCover: boolean }) {
    if (!params.isCover) {
      // MVP: allow turning off by setting cover to another image later; disallow empty cover via simplicity
      // For now just forbid.
      throw new ForbiddenException("To change cover, set another image as cover");
    }

    const asset = await this.prisma.mediaAsset.findFirst({
      where: { id: params.assetId, agencyId: params.agencyId, listingId: params.listingId, deletedAt: null, uploadStatus: "ACTIVE", mediaType: "IMAGE" },
      select: { id: true, isCover: true },
    });
    if (!asset) throw new NotFoundException("Media asset not found");

    await this.prisma.$transaction(async (tx) => {
      await tx.mediaAsset.updateMany({
        where: {
          agencyId: params.agencyId,
          listingId: params.listingId,
          mediaType: "IMAGE",
          deletedAt: null,
          uploadStatus: "ACTIVE",
          isCover: true,
        },
        data: { isCover: false },
      });
      await tx.mediaAsset.update({
        where: { id: params.assetId },
        data: { isCover: true },
      });
    });

    return { ok: true };
  }
}

