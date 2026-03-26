import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { AttachmentTargetType, MediaUploadStatus, UserRole } from "@prisma/client";
import { randomUUID } from "crypto";
import { ROLES_MUTATE, ROLES_READ, hasFullAgencyDataScope } from "../auth/rbac.constants";
import { leadScopeWhere, listingScopeWhere, taskScopeWhere, type ActorScope } from "../auth/rbac-query.util";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AttachmentsService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly signedUrlTtlSeconds: number;
  private readonly maxBytes: number;

  constructor(private readonly prisma: PrismaService) {
    const endpoint = process.env.S3_ENDPOINT;
    const region = process.env.S3_REGION ?? "us-east-1";
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    this.bucket = process.env.S3_BUCKET ?? "CHANGE_ME_BUCKET";
    this.signedUrlTtlSeconds = Number(process.env.S3_SIGNED_URL_TTL_SECONDS ?? 600);
    this.maxBytes = Number(process.env.ATTACHMENT_MAX_BYTES ?? 20 * 1024 * 1024);

    this.s3 = new S3Client({
      endpoint: endpoint,
      region,
      credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
      forcePathStyle: true,
    });
  }

  private sanitizeFileName(fileName: string) {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  }

  private assertSize(sizeBytes: number) {
    if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) throw new BadRequestException("Invalid file size");
    if (sizeBytes > this.maxBytes) throw new BadRequestException("File is too large");
  }

  private async assertTargetVisible(params: { agencyId: string; actor: ActorScope; targetType: AttachmentTargetType; targetId: string }) {
    if (params.targetType === "LEAD") {
      const lead = await this.prisma.lead.findFirst({
        where: { id: params.targetId, agencyId: params.agencyId, ...leadScopeWhere(params.actor) },
        select: { id: true },
      });
      if (!lead) throw new NotFoundException("Lead not found");
      return { leadId: lead.id };
    }
    if (params.targetType === "LISTING") {
      const listing = await this.prisma.listing.findFirst({
        where: { id: params.targetId, agencyId: params.agencyId, deletedAt: null, ...listingScopeWhere(params.actor) },
        select: { id: true, status: true },
      });
      if (!listing) throw new NotFoundException("Listing not found");
      return { listingId: listing.id, listingStatus: listing.status };
    }
    if (params.targetType === "TASK") {
      const task = await this.prisma.task.findFirst({
        where: { id: params.targetId, agencyId: params.agencyId, ...taskScopeWhere(params.actor) },
        select: { id: true, leadId: true },
      });
      if (!task) throw new NotFoundException("Task not found");
      return { taskId: task.id, leadId: task.leadId ?? undefined };
    }
    throw new BadRequestException("Unsupported targetType");
  }

  async list(params: { agencyId: string; actor: ActorScope; targetType: AttachmentTargetType; targetId: string }) {
    if (!ROLES_READ.includes(params.actor.role)) throw new ForbiddenException("Not allowed");
    await this.assertTargetVisible(params);
    const items = await this.prisma.attachment.findMany({
      where: { agencyId: params.agencyId, targetType: params.targetType, targetId: params.targetId, uploadStatus: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return { items };
  }

  async createSignedUpload(params: {
    agencyId: string;
    actor: ActorScope;
    actorMembershipId: string;
    targetType: AttachmentTargetType;
    targetId: string;
    fileName: string;
    contentType: string;
    sizeBytes: number;
  }) {
    if (!ROLES_MUTATE.includes(params.actor.role)) throw new ForbiddenException("Not allowed");
    this.assertSize(params.sizeBytes);
    const ctx = await this.assertTargetVisible(params);

    // Optional extra rule: Agents can only attach to draft listings (consistent with other listing edits).
    if (params.targetType === "LISTING" && params.actor.role === UserRole.AGENT && !hasFullAgencyDataScope(params.actor.role)) {
      // listingStatus exists when targetType LISTING
      const st = (ctx as any).listingStatus;
      if (st && st !== "DRAFT") throw new ForbiddenException("Attachments can only be edited while the listing is in draft");
    }

    const id = randomUUID();
    const sanitized = this.sanitizeFileName(params.fileName);
    const storageKey = `agencies/${params.agencyId}/attachments/${params.targetType.toLowerCase()}/${params.targetId}/${id}-${sanitized}`;

    const created = await this.prisma.attachment.create({
      data: {
        id,
        agencyId: params.agencyId,
        targetType: params.targetType,
        targetId: params.targetId,
        leadId: (ctx as any).leadId ?? null,
        listingId: (ctx as any).listingId ?? null,
        taskId: (ctx as any).taskId ?? null,
        uploadStatus: MediaUploadStatus.UPLOADING,
        storageKey,
        fileName: params.fileName,
        mimeType: params.contentType,
        sizeBytes: params.sizeBytes,
        createdByMembershipId: params.actorMembershipId,
      },
    });

    const endpoint = process.env.S3_ENDPOINT;
    if (!endpoint || !process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) {
      throw new BadRequestException("Attachment storage is not configured");
    }

    const cmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
      ContentType: params.contentType,
      ContentLength: params.sizeBytes,
    });

    const uploadUrl = await getSignedUrl(this.s3, cmd, { expiresIn: this.signedUrlTtlSeconds });

    return { attachment: created, uploadUrl, expiresInSeconds: this.signedUrlTtlSeconds };
  }

  async completeUpload(params: { agencyId: string; actor: ActorScope; targetType: AttachmentTargetType; targetId: string; attachmentId: string }) {
    if (!ROLES_MUTATE.includes(params.actor.role)) throw new ForbiddenException("Not allowed");
    await this.assertTargetVisible(params);
    const item = await this.prisma.attachment.findFirst({
      where: { id: params.attachmentId, agencyId: params.agencyId, targetType: params.targetType, targetId: params.targetId },
    });
    if (!item) throw new NotFoundException("Attachment not found");
    if (item.uploadStatus !== "UPLOADING") throw new BadRequestException("Upload is not in progress");
    await this.prisma.attachment.update({ where: { id: item.id }, data: { uploadStatus: "ACTIVE" } });
    return { ok: true };
  }

  async getDownloadUrl(params: { agencyId: string; actor: ActorScope; targetType: AttachmentTargetType; targetId: string; attachmentId: string }) {
    if (!ROLES_READ.includes(params.actor.role)) throw new ForbiddenException("Not allowed");
    await this.assertTargetVisible(params);

    const item = await this.prisma.attachment.findFirst({
      where: {
        id: params.attachmentId,
        agencyId: params.agencyId,
        targetType: params.targetType,
        targetId: params.targetId,
        uploadStatus: "ACTIVE",
      },
      select: { storageKey: true, fileName: true },
    });
    if (!item) throw new NotFoundException("Attachment not found");

    const endpoint = process.env.S3_ENDPOINT;
    if (!endpoint || !process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) {
      throw new BadRequestException("Attachment storage is not configured");
    }

    const cmd = new GetObjectCommand({
      Bucket: this.bucket,
      Key: item.storageKey,
      ResponseContentDisposition: `attachment; filename="${String(item.fileName).replace(/"/g, "")}"`,
    });
    const url = await getSignedUrl(this.s3, cmd, { expiresIn: this.signedUrlTtlSeconds });
    return { url, expiresInSeconds: this.signedUrlTtlSeconds };
  }
}

