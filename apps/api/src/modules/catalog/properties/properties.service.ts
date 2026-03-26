import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { Prisma, type EnergyClass } from "@prisma/client";
import type { ActorScope } from "../../auth/rbac-query.util";
import { contactScopeWhere, propertyScopeWhere } from "../../auth/rbac-query.util";

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(params: {
    agencyId: string;
    actor: ActorScope;
    ownerContactId: string;
    actorMembershipId?: string;
    data: {
      address: string;
      city?: string;
      area?: string;
      latitude?: number;
      longitude?: number;
      energyClass?: EnergyClass;
      features?: string[];
    };
  }) {
    // Ensure owner contact belongs to this agency
    const owner = await this.prisma.contact.findFirst({
      where: { id: params.ownerContactId, agencyId: params.agencyId, ...contactScopeWhere(params.actor) },
      select: { id: true },
    });
    if (!owner) throw new BadRequestException("Invalid ownerContactId");

    const property = await this.prisma.property.create({
      data: {
        agencyId: params.agencyId,
        ownerContactId: params.ownerContactId,
        address: params.data.address,
        city: params.data.city ?? undefined,
        area: params.data.area ?? undefined,
        latitude: params.data.latitude ?? undefined,
        longitude: params.data.longitude ?? undefined,
        energyClass: params.data.energyClass ?? undefined,
        features: params.data.features ?? undefined,
        createdByMembershipId: params.actorMembershipId,
      },
    });

    return property;
  }

  async list(params: {
    agencyId: string;
    actor: ActorScope;
    q?: string;
    ownerContactId?: string;
    skip: number;
    take: number;
    sort?: "createdAt" | "address";
  }) {
    const where: Prisma.PropertyWhereInput = {
      agencyId: params.agencyId,
      deletedAt: null,
      ...propertyScopeWhere(params.actor),
    };

    if (params.ownerContactId) where.ownerContactId = params.ownerContactId;

    if (params.q) {
      const q = params.q.trim();
      where.OR = [
        { address: { contains: q, mode: "insensitive" } },
        {
          ownerContact: {
            OR: [
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
              { organizationName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    const orderBy: Prisma.PropertyOrderByWithRelationInput[] =
      params.sort === "address"
        ? ([{ address: "asc" }, { createdAt: "desc" }] as const)
        : ([{ createdAt: "desc" }] as const);

    const [items, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        orderBy,
        skip: params.skip,
        take: params.take,
        include: {
          ownerContact: { select: { id: true, firstName: true, lastName: true, organizationName: true, email: true } },
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    return { items, total };
  }

  async get(params: { agencyId: string; actor: ActorScope; id: string }) {
    const property = await this.prisma.property.findFirst({
      where: { id: params.id, agencyId: params.agencyId, deletedAt: null, ...propertyScopeWhere(params.actor) },
      include: {
        ownerContact: { select: { id: true, firstName: true, lastName: true, organizationName: true, email: true } },
      },
    });
    if (!property) throw new NotFoundException("Property not found");
    return property;
  }

  async update(params: {
    agencyId: string;
    actor: ActorScope;
    actorMembershipId?: string;
    id: string;
    data: {
      ownerContactId?: string;
      address?: string;
      city?: string;
      area?: string;
      latitude?: number | null;
      longitude?: number | null;
      energyClass?: EnergyClass;
      features?: string[] | null;
    };
  }) {
    const existing = await this.prisma.property.findFirst({
      where: { id: params.id, agencyId: params.agencyId, deletedAt: null, ...propertyScopeWhere(params.actor) },
      select: { id: true, ownerContactId: true },
    });
    if (!existing) throw new NotFoundException("Property not found");

    if (typeof params.data.ownerContactId === "string") {
      const owner = await this.prisma.contact.findFirst({
        where: { id: params.data.ownerContactId, agencyId: params.agencyId, ...contactScopeWhere(params.actor) },
        select: { id: true },
      });
      if (!owner) throw new BadRequestException("Invalid ownerContactId");
    }

    const property = await this.prisma.property.update({
      where: { id: existing.id },
      data: {
        ownerContactId: params.data.ownerContactId ?? undefined,
        address: params.data.address ?? undefined,
        city: params.data.city ?? undefined,
        area: params.data.area ?? undefined,
        latitude: params.data.latitude === null ? null : params.data.latitude ?? undefined,
        longitude: params.data.longitude === null ? null : params.data.longitude ?? undefined,
        energyClass: params.data.energyClass ?? undefined,
        features: params.data.features === null ? Prisma.DbNull : params.data.features ?? undefined,
      },
    });

    // Return fully loaded property
    return this.get({ agencyId: params.agencyId, actor: params.actor, id: property.id });
  }

  async softDelete(params: { agencyId: string; actor: ActorScope; actorMembershipId?: string; id: string }) {
    const existing = await this.prisma.property.findFirst({
      where: { id: params.id, agencyId: params.agencyId, deletedAt: null, ...propertyScopeWhere(params.actor) },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException("Property not found");

    await this.prisma.property.update({
      where: { id: existing.id },
      data: {
        deletedAt: new Date(),
        deletedByMembershipId: params.actorMembershipId ?? null,
      },
    });

    return { ok: true };
  }

  async createInternalNote(params: {
    agencyId: string;
    actor: ActorScope;
    actorMembershipId?: string;
    propertyId: string;
    content: string;
  }) {
    const property = await this.prisma.property.findFirst({
      where: { id: params.propertyId, agencyId: params.agencyId, deletedAt: null, ...propertyScopeWhere(params.actor) },
      select: { id: true },
    });
    if (!property) throw new NotFoundException("Property not found");

    return this.prisma.propertyInternalNote.create({
      data: {
        agencyId: params.agencyId,
        propertyId: params.propertyId,
        content: params.content,
        createdByMembershipId: params.actorMembershipId ?? null,
      },
    });
  }

  async listInternalNotes(params: {
    agencyId: string;
    actor: ActorScope;
    propertyId: string;
    skip: number;
    take: number;
  }) {
    const property = await this.prisma.property.findFirst({
      where: { id: params.propertyId, agencyId: params.agencyId, deletedAt: null, ...propertyScopeWhere(params.actor) },
      select: { id: true },
    });
    if (!property) throw new NotFoundException("Property not found");

    const where = { agencyId: params.agencyId, propertyId: params.propertyId };

    const [items, total] = await Promise.all([
      this.prisma.propertyInternalNote.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.propertyInternalNote.count({ where }),
    ]);

    return { items, total };
  }

  async deleteInternalNote(params: { agencyId: string; actor: ActorScope; propertyId: string; noteId: string }) {
    const property = await this.prisma.property.findFirst({
      where: { id: params.propertyId, agencyId: params.agencyId, deletedAt: null, ...propertyScopeWhere(params.actor) },
      select: { id: true },
    });
    if (!property) throw new NotFoundException("Property not found");

    const existing = await this.prisma.propertyInternalNote.findFirst({
      where: { id: params.noteId, agencyId: params.agencyId, propertyId: params.propertyId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException("Internal note not found");

    await this.prisma.propertyInternalNote.delete({ where: { id: existing.id } });
    return { ok: true };
  }
}

