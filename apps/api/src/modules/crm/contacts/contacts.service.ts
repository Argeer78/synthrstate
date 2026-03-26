import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ActivityAction, ActivityEntityType, Prisma } from "@prisma/client";
import { ActivityService } from "../timeline/activity.service";
import type { ActorScope } from "../../auth/rbac-query.util";
import { contactScopeWhere } from "../../auth/rbac-query.util";

@Injectable()
export class ContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
  ) {}

  async create(params: {
    agencyId: string;
    actorMembershipId?: string;
    data: {
      type?: any;
      firstName?: string;
      lastName?: string;
      organizationName?: string;
      email?: string;
      phone?: string;
    };
  }) {
    const contact = await this.prisma.contact.create({
      data: {
        agencyId: params.agencyId,
        ...params.data,
        email: params.data.email?.toLowerCase(),
        createdByMembershipId: params.actorMembershipId,
      },
    });

    await this.activity.log({
      agencyId: params.agencyId,
      actorMembershipId: params.actorMembershipId,
      entityType: ActivityEntityType.CONTACT,
      entityId: contact.id,
      action: ActivityAction.CREATED,
      contactId: contact.id,
      message: "Contact created",
    });

    return contact;
  }

  async list(params: {
    agencyId: string;
    actor: ActorScope;
    q?: string;
    skip: number;
    take: number;
    sort?: "createdAt" | "lastName";
  }) {
    const where: Prisma.ContactWhereInput = {
      agencyId: params.agencyId,
      ...contactScopeWhere(params.actor),
    };
    if (params.q) {
      const q = params.q.trim();
      where.OR = [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { organizationName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ];
    }

    const orderBy: Prisma.ContactOrderByWithRelationInput[] =
      params.sort === "lastName"
        ? ([{ lastName: "asc" }, { createdAt: "desc" }] as const)
        : ([{ createdAt: "desc" }] as const);

    const [items, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        orderBy,
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.contact.count({ where }),
    ]);

    return { items, total };
  }

  async get(params: { agencyId: string; actor: ActorScope; id: string }) {
    const contact = await this.prisma.contact.findFirst({
      where: { id: params.id, agencyId: params.agencyId, ...contactScopeWhere(params.actor) },
    });
    if (!contact) throw new NotFoundException("Contact not found");
    return contact;
  }

  async update(params: {
    agencyId: string;
    actor: ActorScope;
    actorMembershipId?: string;
    id: string;
    data: {
      type?: any;
      firstName?: string;
      lastName?: string;
      organizationName?: string;
      email?: string;
      phone?: string;
    };
  }) {
    const updated = await this.prisma.contact.updateMany({
      where: { id: params.id, agencyId: params.agencyId, ...contactScopeWhere(params.actor) },
      data: {
        ...params.data,
        email: params.data.email?.toLowerCase(),
      },
    });
    if (updated.count !== 1) throw new NotFoundException("Contact not found");

    const contact = await this.get({ agencyId: params.agencyId, actor: params.actor, id: params.id });

    await this.activity.log({
      agencyId: params.agencyId,
      actorMembershipId: params.actorMembershipId,
      entityType: ActivityEntityType.CONTACT,
      entityId: contact.id,
      action: ActivityAction.UPDATED,
      contactId: contact.id,
      message: "Contact updated",
    });

    return contact;
  }

  async delete(params: { agencyId: string; actor: ActorScope; actorMembershipId?: string; id: string }) {
    const deleted = await this.prisma.contact.deleteMany({
      where: { id: params.id, agencyId: params.agencyId, ...contactScopeWhere(params.actor) },
    });
    if (deleted.count !== 1) throw new NotFoundException("Contact not found");

    await this.activity.log({
      agencyId: params.agencyId,
      actorMembershipId: params.actorMembershipId,
      entityType: ActivityEntityType.CONTACT,
      entityId: params.id,
      action: ActivityAction.UPDATED,
      contactId: params.id,
      message: "Contact deleted",
      metadata: { deleted: true },
    });

    return { ok: true };
  }
}

