import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { ROLES_MUTATE, ROLES_READ } from "../auth/rbac.constants";
import { getAuthContext } from "../crm/shared/tenant.req";
import { AttachmentsService } from "./attachments.service";
import { CompleteUploadDto, CreateSignedUploadDto, ListAttachmentsQueryDto } from "./dto/attachments.dto";

@Controller("collab/attachments")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttachmentsController {
  constructor(private readonly attachments: AttachmentsService) {}

  @Get()
  @Roles(...ROLES_READ)
  async list(@Req() req: Request, @Query() query: ListAttachmentsQueryDto) {
    const ctx = getAuthContext(req);
    const actor = { role: ctx.role, membershipId: ctx.membershipId };
    return await this.attachments.list({ agencyId: ctx.agencyId, actor, targetType: query.targetType, targetId: query.targetId });
  }

  @Post("signed-upload")
  @Roles(...ROLES_MUTATE)
  async signedUpload(@Req() req: Request, @Body() dto: CreateSignedUploadDto) {
    const ctx = getAuthContext(req);
    const actor = { role: ctx.role, membershipId: ctx.membershipId };
    return await this.attachments.createSignedUpload({
      agencyId: ctx.agencyId,
      actor,
      actorMembershipId: ctx.membershipId,
      targetType: dto.targetType,
      targetId: dto.targetId,
      fileName: dto.fileName,
      contentType: dto.contentType,
      sizeBytes: dto.sizeBytes,
    });
  }

  @Post("complete-upload")
  @Roles(...ROLES_MUTATE)
  async complete(@Req() req: Request, @Body() dto: CompleteUploadDto, @Query() query: ListAttachmentsQueryDto) {
    const ctx = getAuthContext(req);
    const actor = { role: ctx.role, membershipId: ctx.membershipId };
    return await this.attachments.completeUpload({
      agencyId: ctx.agencyId,
      actor,
      targetType: query.targetType,
      targetId: query.targetId,
      attachmentId: dto.attachmentId,
    });
  }

  @Get("download-url")
  @Roles(...ROLES_READ)
  async downloadUrl(@Req() req: Request, @Query() query: ListAttachmentsQueryDto, @Query("attachmentId") attachmentId: string) {
    const ctx = getAuthContext(req);
    const actor = { role: ctx.role, membershipId: ctx.membershipId };
    return await this.attachments.getDownloadUrl({
      agencyId: ctx.agencyId,
      actor,
      targetType: query.targetType,
      targetId: query.targetId,
      attachmentId,
    });
  }
}

