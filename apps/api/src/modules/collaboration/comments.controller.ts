import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { ROLES_MUTATE, ROLES_READ } from "../auth/rbac.constants";
import { getAuthContext } from "../crm/shared/tenant.req";
import { CreateCommentDto, ListCommentsQueryDto } from "./dto/comments.dto";
import { CommentsService } from "./comments.service";

@Controller("collab/comments")
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Get()
  @Roles(...ROLES_READ)
  async list(@Req() req: Request, @Query() query: ListCommentsQueryDto) {
    const ctx = getAuthContext(req);
    const actor = { role: ctx.role, membershipId: ctx.membershipId };
    return await this.comments.list({ agencyId: ctx.agencyId, actor, targetType: query.targetType, targetId: query.targetId });
  }

  @Post()
  @Roles(...ROLES_MUTATE)
  async create(@Req() req: Request, @Body() dto: CreateCommentDto) {
    const ctx = getAuthContext(req);
    const actor = { role: ctx.role, membershipId: ctx.membershipId };
    return await this.comments.create({
      agencyId: ctx.agencyId,
      actor,
      actorMembershipId: ctx.membershipId,
      targetType: dto.targetType,
      targetId: dto.targetId,
      body: dto.body,
    });
  }
}

