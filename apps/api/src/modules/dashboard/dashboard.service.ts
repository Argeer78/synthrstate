import { Injectable } from "@nestjs/common";
import { InquiryStatus, TaskStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { ActorScope } from "../auth/rbac-query.util";
import {
  activityScopeWhere,
  contactScopeWhere,
  inquiryScopeWhere,
  leadScopeWhere,
  listingScopeWhere,
  taskScopeWhere,
} from "../auth/rbac-query.util";

type RecentItem =
  | {
      type: "inquiry.new" | "inquiry.converted";
      at: string;
      title: string;
      subtitle?: string;
      inquiryId: string;
      listingTitle?: string;
    }
  | {
      type: "activity";
      at: string;
      title: string;
      subtitle?: string;
      entityType: string;
      action: string;
      entityId: string;
    };

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(params: { agencyId: string; actor: ActorScope }) {
    const now = new Date();
    const dueSoonUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const contactWhere: any = { agencyId: params.agencyId, ...contactScopeWhere(params.actor) };
    const leadWhere: any = { agencyId: params.agencyId, ...leadScopeWhere(params.actor) };
    const inquiryWhereBase: any = { agencyId: params.agencyId, ...inquiryScopeWhere(params.actor) };
    const listingWhere: any = {
      agencyId: params.agencyId,
      deletedAt: null,
      property: { deletedAt: null },
      ...listingScopeWhere(params.actor),
    };
    const taskWhereBase: any = { agencyId: params.agencyId, ...taskScopeWhere(params.actor) };

    const [
      totalContacts,
      totalLeads,
      newInquiries,
      activeListings,
      tasksDueSoon,
      recentNewInquiries,
      recentConvertedInquiries,
      recentActivity,
    ] = await Promise.all([
      this.prisma.contact.count({ where: contactWhere }),
      this.prisma.lead.count({ where: leadWhere }),
      this.prisma.inquiry.count({ where: { ...inquiryWhereBase, status: InquiryStatus.NEW } }),
      this.prisma.listing.count({ where: { ...listingWhere, status: "ACTIVE" } }),
      this.prisma.task.count({
        where: {
          ...taskWhereBase,
          dueAt: { gte: now, lte: dueSoonUntil },
          status: { not: TaskStatus.DONE },
        },
      }),
      this.prisma.inquiry.findMany({
        where: { ...inquiryWhereBase, status: InquiryStatus.NEW },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
          listing: { select: { title: true } },
        },
      }),
      this.prisma.inquiry.findMany({
        where: { ...inquiryWhereBase, status: InquiryStatus.CONVERTED },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          updatedAt: true,
          listing: { select: { title: true } },
        },
      }),
      this.prisma.activityEvent.findMany({
        where: { agencyId: params.agencyId, ...activityScopeWhere(params.actor) } as any,
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          createdAt: true,
          entityType: true,
          entityId: true,
          action: true,
          message: true,
        },
      }),
    ]);

    const recent: RecentItem[] = [];
    for (const i of recentNewInquiries) {
      recent.push({
        type: "inquiry.new",
        at: i.createdAt.toISOString(),
        title: "New inquiry received",
        subtitle: `${i.name}${i.email ? ` · ${i.email}` : ""}${i.phone ? ` · ${i.phone}` : ""}`,
        inquiryId: i.id,
        listingTitle: i.listing?.title ?? undefined,
      });
    }
    for (const i of recentConvertedInquiries) {
      recent.push({
        type: "inquiry.converted",
        at: i.updatedAt.toISOString(),
        title: "Inquiry converted",
        subtitle: `${i.name}${i.listing?.title ? ` · ${i.listing.title}` : ""}`,
        inquiryId: i.id,
        listingTitle: i.listing?.title ?? undefined,
      });
    }
    for (const a of recentActivity) {
      const title = a.message || `${a.entityType} ${a.action}`.toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
      recent.push({
        type: "activity",
        at: a.createdAt.toISOString(),
        title,
        subtitle: `${a.entityType} · ${a.action}`,
        entityType: a.entityType,
        action: a.action,
        entityId: a.entityId,
      });
    }

    recent.sort((x, y) => (x.at < y.at ? 1 : x.at > y.at ? -1 : 0));

    return {
      counts: {
        totalContacts,
        totalLeads,
        newInquiries,
        activeListings,
        tasksDueSoon,
      },
      recent: recent.slice(0, 12),
    };
  }
}

