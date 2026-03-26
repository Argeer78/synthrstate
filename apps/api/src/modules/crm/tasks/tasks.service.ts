import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ActivityAction, ActivityEntityType, Prisma, TaskStatus } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import { ActivityService } from "../timeline/activity.service";
import type { ActorScope } from "../../auth/rbac-query.util";
import { leadScopeWhere, taskScopeWhere } from "../../auth/rbac-query.util";
import { assertAgentAssignsSelfOnly } from "../../auth/rbac-assign.util";

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
  ) {}

  async create(params: {
    agencyId: string;
    actor: ActorScope;
    actorMembershipId?: string;
    data: {
      title: string;
      description?: string;
      status?: TaskStatus;
      dueAt?: string;
      leadId?: string;
      assignedToMembershipId?: string;
    };
  }) {
    assertAgentAssignsSelfOnly(
      params.actor.role,
      params.actor.membershipId,
      params.data.assignedToMembershipId,
    );

    if (params.data.leadId) {
      const lead = await this.prisma.lead.findFirst({
        where: { id: params.data.leadId, agencyId: params.agencyId, ...leadScopeWhere(params.actor) },
        select: { id: true, contactId: true },
      });
      if (!lead) throw new BadRequestException("Invalid leadId");
    }

    const task = await this.prisma.task.create({
      data: {
        agencyId: params.agencyId,
        title: params.data.title,
        description: params.data.description,
        status: params.data.status ?? TaskStatus.TODO,
        dueAt: params.data.dueAt ? new Date(params.data.dueAt) : undefined,
        leadId: params.data.leadId,
        assignedToMembershipId: params.data.assignedToMembershipId,
        createdByMembershipId: params.actorMembershipId,
      },
    });

    await this.activity.log({
      agencyId: params.agencyId,
      actorMembershipId: params.actorMembershipId,
      entityType: ActivityEntityType.TASK,
      entityId: task.id,
      action: ActivityAction.CREATED,
      taskId: task.id,
      leadId: task.leadId ?? undefined,
      message: "Task created",
    });

    if (task.assignedToMembershipId) {
      await this.activity.log({
        agencyId: params.agencyId,
        actorMembershipId: params.actorMembershipId,
        entityType: ActivityEntityType.TASK,
        entityId: task.id,
        action: ActivityAction.ASSIGNED,
        taskId: task.id,
        leadId: task.leadId ?? undefined,
        message: "Task assigned",
        metadata: { to: task.assignedToMembershipId },
      });
    }

    return task;
  }

  async list(params: {
    agencyId: string;
    actor: ActorScope;
    status?: TaskStatus;
    assignedToMembershipId?: string;
    leadId?: string;
    skip: number;
    take: number;
    sort?: "dueAt" | "createdAt";
  }) {
    const where: Prisma.TaskWhereInput = {
      agencyId: params.agencyId,
      ...taskScopeWhere(params.actor),
    };
    if (params.status) where.status = params.status;
    if (params.assignedToMembershipId) where.assignedToMembershipId = params.assignedToMembershipId;
    if (params.leadId) where.leadId = params.leadId;

    const orderBy: Prisma.TaskOrderByWithRelationInput[] =
      params.sort === "dueAt"
        ? ([{ dueAt: "asc" }, { createdAt: "desc" }] as const)
        : ([{ createdAt: "desc" }] as const);

    const [items, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        orderBy,
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.task.count({ where }),
    ]);

    return { items, total };
  }

  async get(params: { agencyId: string; actor: ActorScope; id: string }) {
    const task = await this.prisma.task.findFirst({
      where: { id: params.id, agencyId: params.agencyId, ...taskScopeWhere(params.actor) },
    });
    if (!task) throw new NotFoundException("Task not found");
    return task;
  }

  async update(params: {
    agencyId: string;
    actor: ActorScope;
    actorMembershipId?: string;
    id: string;
    data: {
      title?: string;
      description?: string;
      status?: TaskStatus;
      dueAt?: string;
      assignedToMembershipId?: string;
    };
  }) {
    assertAgentAssignsSelfOnly(
      params.actor.role,
      params.actor.membershipId,
      params.data.assignedToMembershipId,
    );

    const existing = await this.prisma.task.findFirst({
      where: { id: params.id, agencyId: params.agencyId, ...taskScopeWhere(params.actor) },
      select: { id: true, status: true, assignedToMembershipId: true, leadId: true },
    });
    if (!existing) throw new NotFoundException("Task not found");

    const updated = await this.prisma.task.update({
      where: { id: existing.id },
      data: {
        title: params.data.title,
        description: params.data.description,
        status: params.data.status,
        dueAt: params.data.dueAt ? new Date(params.data.dueAt) : undefined,
        assignedToMembershipId: params.data.assignedToMembershipId,
      },
    });

    if (params.data.status && params.data.status !== existing.status) {
      await this.activity.log({
        agencyId: params.agencyId,
        actorMembershipId: params.actorMembershipId,
        entityType: ActivityEntityType.TASK,
        entityId: updated.id,
        action: ActivityAction.STATUS_CHANGED,
        taskId: updated.id,
        leadId: updated.leadId ?? undefined,
        message: `Task status changed: ${existing.status} -> ${params.data.status}`,
        metadata: { from: existing.status, to: params.data.status },
      });
      if (params.data.status === TaskStatus.DONE) {
        await this.activity.log({
          agencyId: params.agencyId,
          actorMembershipId: params.actorMembershipId,
          entityType: ActivityEntityType.TASK,
          entityId: updated.id,
          action: ActivityAction.COMPLETED,
          taskId: updated.id,
          leadId: updated.leadId ?? undefined,
          message: "Task completed",
        });
      }
    } else {
      await this.activity.log({
        agencyId: params.agencyId,
        actorMembershipId: params.actorMembershipId,
        entityType: ActivityEntityType.TASK,
        entityId: updated.id,
        action: ActivityAction.UPDATED,
        taskId: updated.id,
        leadId: updated.leadId ?? undefined,
        message: "Task updated",
      });
    }

    if (
      typeof params.data.assignedToMembershipId === "string" &&
      params.data.assignedToMembershipId !== existing.assignedToMembershipId
    ) {
      await this.activity.log({
        agencyId: params.agencyId,
        actorMembershipId: params.actorMembershipId,
        entityType: ActivityEntityType.TASK,
        entityId: updated.id,
        action: ActivityAction.ASSIGNED,
        taskId: updated.id,
        leadId: updated.leadId ?? undefined,
        message: "Task assigned",
        metadata: { from: existing.assignedToMembershipId, to: params.data.assignedToMembershipId },
      });
    }

    return this.get({ agencyId: params.agencyId, actor: params.actor, id: updated.id });
  }

  async delete(params: { agencyId: string; actor: ActorScope; actorMembershipId?: string; id: string }) {
    const existing = await this.prisma.task.findFirst({
      where: { id: params.id, agencyId: params.agencyId, ...taskScopeWhere(params.actor) },
      select: { id: true, leadId: true },
    });
    if (!existing) throw new NotFoundException("Task not found");

    await this.prisma.task.delete({ where: { id: existing.id } });

    await this.activity.log({
      agencyId: params.agencyId,
      actorMembershipId: params.actorMembershipId,
      entityType: ActivityEntityType.TASK,
      entityId: existing.id,
      action: ActivityAction.UPDATED,
      taskId: existing.id,
      leadId: existing.leadId ?? undefined,
      message: "Task deleted",
      metadata: { deleted: true },
    });

    return { ok: true };
  }
}

