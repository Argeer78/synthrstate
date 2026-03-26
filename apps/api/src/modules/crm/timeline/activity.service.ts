import { Injectable } from "@nestjs/common";
import { ActivityAction, ActivityEntityType } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    agencyId: string;
    actorMembershipId?: string;
    entityType: ActivityEntityType;
    entityId: string;
    action: ActivityAction;
    message?: string;
    contactId?: string;
    leadId?: string;
    taskId?: string;
    noteId?: string;
    metadata?: unknown;
  }) {
    return this.prisma.activityEvent.create({
      data: {
        agencyId: params.agencyId,
        actorMembershipId: params.actorMembershipId,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        message: params.message,
        contactId: params.contactId,
        leadId: params.leadId,
        taskId: params.taskId,
        noteId: params.noteId,
        metadata: params.metadata as any,
      },
    });
  }
}

