import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ActivityAction, ActivityEntityType, LeadStatus } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import { ActivityService } from "../timeline/activity.service";

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
  ) {}

  async create(params: {
    agencyId: string;
    actorMembershipId?: string;
    data: {
      contactId: string;
      status?: LeadStatus;
      title?: string;
      assignedToMembershipId?: string;
    };
  }) {
    const contact = await this.prisma.contact.findFirst({
      where: { id: params.data.contactId, agencyId: params.agencyId },
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
    status?: LeadStatus;
    assignedToMembershipId?: string;
    contactId?: string;
    q?: string;
    skip: number;
    take: number;
  }) {
    const where: any = { agencyId: params.agencyId };
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

  async get(params: { agencyId: string; id: string }) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: params.id, agencyId: params.agencyId },
      include: { contact: true },
    });
    if (!lead) throw new NotFoundException("Lead not found");
    return lead;
  }

  async update(params: {
    agencyId: string;
    actorMembershipId?: string;
    id: string;
    data: {
      status?: LeadStatus;
      title?: string;
      assignedToMembershipId?: string;
    };
  }) {
    const existing = await this.prisma.lead.findFirst({
      where: { id: params.id, agencyId: params.agencyId },
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
    }

    return this.get({ agencyId: params.agencyId, id: updated.id });
  }

  async delete(params: { agencyId: string; actorMembershipId?: string; id: string }) {
    const existing = await this.prisma.lead.findFirst({
      where: { id: params.id, agencyId: params.agencyId },
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

