import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ActivityAction, ActivityEntityType, LeadStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import { ActivityService } from "../timeline/activity.service";
import type { ActorScope } from "../../auth/rbac-query.util";
import { contactScopeWhere, leadScopeWhere } from "../../auth/rbac-query.util";
import { assertAgentAssignsSelfOnly } from "../../auth/rbac-assign.util";
import { NotificationsService } from "../../collaboration/notifications.service";
import { NotificationType } from "@prisma/client";

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(params: {
    agencyId: string;
    actor: ActorScope;
    actorMembershipId?: string;
    data: {
      contactId: string;
      status?: LeadStatus;
      title?: string;
      assignedToMembershipId?: string;
    };
  }) {
    assertAgentAssignsSelfOnly(
      params.actor.role,
      params.actor.membershipId,
      params.data.assignedToMembershipId,
    );

    const contact = await this.prisma.contact.findFirst({
      where: { id: params.data.contactId, agencyId: params.agencyId, ...contactScopeWhere(params.actor) },
      select: { id: true },
    });
    if (!contact) throw new BadRequestException("Invalid contactId");

    const lead = await this.prisma.lead.create({
      data: {
        agencyId: params.agencyId,
        contactId: params.data.contactId,
        status: params.data.status ?? LeadStatus.NEW,
        title: params.data.title,
        assignedToMembershipId: params.data.assignedToMembershipId,
        createdByMembershipId: params.actorMembershipId,
      },
    });

    await this.activity.log({
      agencyId: params.agencyId,
      actorMembershipId: params.actorMembershipId,
      entityType: ActivityEntityType.LEAD,
      entityId: lead.id,
      action: ActivityAction.CREATED,
      leadId: lead.id,
      contactId: lead.contactId,
      message: "Lead created",
    });

    return lead;
  }

  async list(params: {
    agencyId: string;
    actor: ActorScope;
    status?: LeadStatus;
    assignedToMembershipId?: string;
    contactId?: string;
    q?: string;
    skip: number;
    take: number;
  }) {
    const where: Prisma.LeadWhereInput = {
      agencyId: params.agencyId,
      ...leadScopeWhere(params.actor),
    };
    if (params.status) where.status = params.status;
    if (params.assignedToMembershipId) where.assignedToMembershipId = params.assignedToMembershipId;
    if (params.contactId) where.contactId = params.contactId;
    if (params.q) {
      const q = params.q.trim();
      where.contact = {
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { organizationName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
        ],
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: params.skip,
        take: params.take,
        include: { contact: true },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return { items, total };
  }

  async get(params: { agencyId: string; actor: ActorScope; id: string }) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: params.id, agencyId: params.agencyId, ...leadScopeWhere(params.actor) },
      include: { contact: true },
    });
    if (!lead) throw new NotFoundException("Lead not found");
    return lead;
  }

  async update(params: {
    agencyId: string;
    actor: ActorScope;
    actorMembershipId?: string;
    id: string;
    data: {
      status?: LeadStatus;
      title?: string;
      assignedToMembershipId?: string;
    };
  }) {
    assertAgentAssignsSelfOnly(
      params.actor.role,
      params.actor.membershipId,
      params.data.assignedToMembershipId,
    );

    const existing = await this.prisma.lead.findFirst({
      where: { id: params.id, agencyId: params.agencyId, ...leadScopeWhere(params.actor) },
      select: { id: true, status: true, assignedToMembershipId: true, contactId: true },
    });
    if (!existing) throw new NotFoundException("Lead not found");

    const updated = await this.prisma.lead.update({
      where: { id: existing.id },
      data: {
        status: params.data.status,
        title: params.data.title,
        assignedToMembershipId: params.data.assignedToMembershipId,
      },
    });

    if (params.data.status && params.data.status !== existing.status) {
      await this.activity.log({
        agencyId: params.agencyId,
        actorMembershipId: params.actorMembershipId,
        entityType: ActivityEntityType.LEAD,
        entityId: updated.id,
        action: ActivityAction.STATUS_CHANGED,
        leadId: updated.id,
        contactId: existing.contactId,
        message: `Lead status changed: ${existing.status} -> ${params.data.status}`,
        metadata: { from: existing.status, to: params.data.status },
      });
    } else {
      await this.activity.log({
        agencyId: params.agencyId,
        actorMembershipId: params.actorMembershipId,
        entityType: ActivityEntityType.LEAD,
        entityId: updated.id,
        action: ActivityAction.UPDATED,
        leadId: updated.id,
        contactId: existing.contactId,
        message: "Lead updated",
      });
    }

    if (
      typeof params.data.assignedToMembershipId === "string" &&
      params.data.assignedToMembershipId !== existing.assignedToMembershipId
    ) {
      await this.activity.log({
        agencyId: params.agencyId,
        actorMembershipId: params.actorMembershipId,
        entityType: ActivityEntityType.LEAD,
        entityId: updated.id,
        action: ActivityAction.ASSIGNED,
        leadId: updated.id,
        contactId: existing.contactId,
        message: "Lead assigned",
        metadata: { from: existing.assignedToMembershipId, to: params.data.assignedToMembershipId },
      });

      // Notify the new assignee (MVP).
      if (params.data.assignedToMembershipId && params.data.assignedToMembershipId !== params.actorMembershipId) {
        await this.notifications.create({
          agencyId: params.agencyId,
          membershipId: params.data.assignedToMembershipId,
          type: NotificationType.LEAD_ASSIGNED,
          title: "Lead assigned to you",
          body: updated.title ?? "A lead was assigned to you",
          leadId: updated.id,
        });
      }
    }

    return this.get({ agencyId: params.agencyId, actor: params.actor, id: updated.id });
  }

  async delete(params: { agencyId: string; actor: ActorScope; actorMembershipId?: string; id: string }) {
    const existing = await this.prisma.lead.findFirst({
      where: { id: params.id, agencyId: params.agencyId, ...leadScopeWhere(params.actor) },
      select: { id: true, contactId: true },
    });
    if (!existing) throw new NotFoundException("Lead not found");

    await this.prisma.lead.delete({ where: { id: existing.id } });

    await this.activity.log({
      agencyId: params.agencyId,
      actorMembershipId: params.actorMembershipId,
      entityType: ActivityEntityType.LEAD,
      entityId: existing.id,
      action: ActivityAction.UPDATED,
      leadId: existing.id,
      contactId: existing.contactId,
      message: "Lead deleted",
      metadata: { deleted: true },
    });

    return { ok: true };
  }
}

