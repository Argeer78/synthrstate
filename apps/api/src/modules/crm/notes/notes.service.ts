import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ActivityAction, ActivityEntityType } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import { ActivityService } from "../timeline/activity.service";

@Injectable()
export class NotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
  ) {}

  async create(params: {
    agencyId: string;
    actorMembershipId?: string;
    data: { content: string; contactId?: string; leadId?: string };
  }) {
    if (!params.data.contactId && !params.data.leadId) {
      throw new BadRequestException("Note must have contactId or leadId");
    }
    if (params.data.contactId && params.data.leadId) {
      throw new BadRequestException("Note cannot have both contactId and leadId in MVP");
    }

    if (params.data.contactId) {
      const contact = await this.prisma.contact.findFirst({
        where: { id: params.data.contactId, agencyId: params.agencyId },
        select: { id: true },
      });
      if (!contact) throw new BadRequestException("Invalid contactId");
    }
    if (params.data.leadId) {
      const lead = await this.prisma.lead.findFirst({
        where: { id: params.data.leadId, agencyId: params.agencyId },
        select: { id: true, contactId: true },
      });
      if (!lead) throw new BadRequestException("Invalid leadId");
    }

    const note = await this.prisma.note.create({
      data: {
        agencyId: params.agencyId,
        content: params.data.content,
        contactId: params.data.contactId,
        leadId: params.data.leadId,
        createdByMembershipId: params.actorMembershipId,
      },
    });

    await this.activity.log({
      agencyId: params.agencyId,
      actorMembershipId: params.actorMembershipId,
      entityType: ActivityEntityType.NOTE,
      entityId: note.id,
      action: ActivityAction.CREATED,
      noteId: note.id,
      contactId: note.contactId ?? undefined,
      leadId: note.leadId ?? undefined,
      message: "Note created",
    });

    return note;
  }

  async list(params: { agencyId: string; contactId?: string; leadId?: string; skip: number; take: number }) {
    const where: any = { agencyId: params.agencyId };
    if (params.contactId) where.contactId = params.contactId;
    if (params.leadId) where.leadId = params.leadId;

    const [items, total] = await Promise.all([
      this.prisma.note.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.note.count({ where }),
    ]);

    return { items, total };
  }

  async get(params: { agencyId: string; id: string }) {
    const note = await this.prisma.note.findFirst({
      where: { id: params.id, agencyId: params.agencyId },
    });
    if (!note) throw new NotFoundException("Note not found");
    return note;
  }

  async update(params: { agencyId: string; actorMembershipId?: string; id: string; content?: string }) {
    const existing = await this.prisma.note.findFirst({
      where: { id: params.id, agencyId: params.agencyId },
      select: { id: true, contactId: true, leadId: true },
    });
    if (!existing) throw new NotFoundException("Note not found");

    await this.prisma.note.update({
      where: { id: existing.id },
      data: { content: params.content },
    });

    const note = await this.get({ agencyId: params.agencyId, id: existing.id });

    await this.activity.log({
      agencyId: params.agencyId,
      actorMembershipId: params.actorMembershipId,
      entityType: ActivityEntityType.NOTE,
      entityId: note.id,
      action: ActivityAction.UPDATED,
      noteId: note.id,
      contactId: note.contactId ?? undefined,
      leadId: note.leadId ?? undefined,
      message: "Note updated",
    });

    return note;
  }

  async delete(params: { agencyId: string; actorMembershipId?: string; id: string }) {
    const existing = await this.prisma.note.findFirst({
      where: { id: params.id, agencyId: params.agencyId },
      select: { id: true, contactId: true, leadId: true },
    });
    if (!existing) throw new NotFoundException("Note not found");

    await this.prisma.note.delete({ where: { id: existing.id } });

    await this.activity.log({
      agencyId: params.agencyId,
      actorMembershipId: params.actorMembershipId,
      entityType: ActivityEntityType.NOTE,
      entityId: existing.id,
      action: ActivityAction.UPDATED,
      noteId: existing.id,
      contactId: existing.contactId ?? undefined,
      leadId: existing.leadId ?? undefined,
      message: "Note deleted",
      metadata: { deleted: true },
    });

    return { ok: true };
  }
}

