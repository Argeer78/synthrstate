import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { CommentTargetType, NotificationType, UserRole } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { ROLES_MUTATE, ROLES_READ } from "../auth/rbac.constants";
import { leadScopeWhere, listingScopeWhere, taskScopeWhere, type ActorScope } from "../auth/rbac-query.util";
import { NotificationsService } from "./notifications.service";

function extractMentionTokens(text: string): string[] {
  // MVP: match @someone or @someone@domain
  const matches = text.match(/@[a-zA-Z0-9._-]+(@[a-zA-Z0-9._-]+\.[a-zA-Z]{2,})?/g) ?? [];
  return Array.from(new Set(matches.map((m) => m.slice(1).toLowerCase()))).slice(0, 20);
}

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private async assertTargetVisible(params: { agencyId: string; actor: ActorScope; targetType: CommentTargetType; targetId: string }) {
    if (params.targetType === "LEAD") {
      const lead = await this.prisma.lead.findFirst({
        where: { id: params.targetId, agencyId: params.agencyId, ...leadScopeWhere(params.actor) },
        select: { id: true, contactId: true },
      });
      if (!lead) throw new NotFoundException("Lead not found");
      return { leadId: lead.id };
    }
    if (params.targetType === "LISTING") {
      const listing = await this.prisma.listing.findFirst({
        where: { id: params.targetId, agencyId: params.agencyId, deletedAt: null, ...listingScopeWhere(params.actor) },
        select: { id: true },
      });
      if (!listing) throw new NotFoundException("Listing not found");
      return { listingId: listing.id };
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

  async list(params: { agencyId: string; actor: ActorScope; targetType: CommentTargetType; targetId: string }) {
    if (!ROLES_READ.includes(params.actor.role)) throw new ForbiddenException("Not allowed");
    await this.assertTargetVisible(params);
    const items = await this.prisma.comment.findMany({
      where: { agencyId: params.agencyId, targetType: params.targetType, targetId: params.targetId },
      orderBy: { createdAt: "asc" },
      include: { createdByMembership: { include: { user: { select: { email: true, fullName: true } } } } },
      take: 200,
    });
    return { items };
  }

  async create(params: { agencyId: string; actor: ActorScope; actorMembershipId: string; targetType: CommentTargetType; targetId: string; body: string }) {
    if (!ROLES_MUTATE.includes(params.actor.role)) throw new ForbiddenException("Not allowed");
    const ctx = await this.assertTargetVisible(params);

    const mentionTokens = extractMentionTokens(params.body);
    const mentionedMemberships = mentionTokens.length
      ? await this.prisma.agencyMembership.findMany({
          where: {
            agencyId: params.agencyId,
            user: { email: { in: mentionTokens } },
          },
          select: { id: true, user: { select: { email: true } } },
        })
      : [];

    const mentionedMembershipIds = mentionedMemberships.map((m) => m.id);

    const created = await this.prisma.comment.create({
      data: {
        agencyId: params.agencyId,
        targetType: params.targetType,
        targetId: params.targetId,
        leadId: (ctx as any).leadId ?? null,
        listingId: (ctx as any).listingId ?? null,
        taskId: (ctx as any).taskId ?? null,
        body: params.body,
        mentionedMembershipIds: mentionedMembershipIds as any,
        createdByMembershipId: params.actorMembershipId,
      },
      include: { createdByMembership: { include: { user: { select: { email: true, fullName: true } } } } },
    });

    // Mention notifications
    await Promise.all(
      mentionedMembershipIds
        .filter((id) => id !== params.actorMembershipId)
        .map((membershipId) =>
          this.notifications.create({
            agencyId: params.agencyId,
            membershipId,
            type: NotificationType.MENTION,
            title: "You were mentioned",
            body: params.body.slice(0, 220),
            commentId: created.id,
            leadId: created.leadId ?? undefined,
            listingId: created.listingId ?? undefined,
            taskId: created.taskId ?? undefined,
          }),
        ),
    );

    return { item: created };
  }
}

