import { Injectable } from "@nestjs/common";
import { NotificationType } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: { agencyId: string; membershipId: string; take: number }) {
    const items = await this.prisma.notification.findMany({
      where: { agencyId: params.agencyId, membershipId: params.membershipId },
      orderBy: { createdAt: "desc" },
      take: params.take,
    });
    const unreadCount = await this.prisma.notification.count({
      where: { agencyId: params.agencyId, membershipId: params.membershipId, isRead: false },
    });
    return { items, unreadCount };
  }

  async markRead(params: { agencyId: string; membershipId: string; ids: string[] }) {
    const ids = Array.from(new Set((params.ids ?? []).filter(Boolean)));
    if (ids.length === 0) return { ok: true };
    await this.prisma.notification.updateMany({
      where: { agencyId: params.agencyId, membershipId: params.membershipId, id: { in: ids } },
      data: { isRead: true, readAt: new Date() },
    });
    return { ok: true };
  }

  async create(params: {
    agencyId: string;
    membershipId: string;
    type: NotificationType;
    title: string;
    body?: string;
    metadata?: unknown;
    leadId?: string;
    listingId?: string;
    taskId?: string;
    inquiryId?: string;
    commentId?: string;
  }) {
    return await this.prisma.notification.create({
      data: {
        agencyId: params.agencyId,
        membershipId: params.membershipId,
        type: params.type,
        title: params.title,
        body: params.body,
        metadata: params.metadata as any,
        leadId: params.leadId,
        listingId: params.listingId,
        taskId: params.taskId,
        inquiryId: params.inquiryId,
        commentId: params.commentId,
      },
    });
  }
}

