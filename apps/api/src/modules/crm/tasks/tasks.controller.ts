import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { TenantGuard } from "../../auth/guards/tenant.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/roles.decorator";
import { ROLES_MUTATE } from "../../auth/rbac.constants";
import { getAuthContext } from "../shared/tenant.req";
import { getPagination } from "../shared/pagination.dto";
import { CreateTaskDto, UpdateTaskDto } from "./dto/task.dto";
import { TaskListQueryDto } from "./dto/task.query.dto";
import { TasksService } from "./tasks.service";

@Controller("crm/tasks")
@UseGuards(JwtAuthGuard, TenantGuard)
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Post()
  @Roles(...ROLES_MUTATE)
  async create(@Req() req: Request, @Body() dto: CreateTaskDto) {
    const { agencyId, membershipId, role } = getAuthContext(req);
    return this.tasks.create({
      agencyId,
      actor: { role, membershipId },
      actorMembershipId: membershipId,
      data: dto,
    });
  }

  @Get()
  async list(@Req() req: Request, @Query() query: TaskListQueryDto) {
    const { agencyId, role, membershipId } = getAuthContext(req);
    const { skip, take, page, pageSize } = getPagination(query);
    const sort = query.sort === "dueAt" ? "dueAt" : "createdAt";
    const { items, total } = await this.tasks.list({
      agencyId,
      actor: { role, membershipId },
      status: query.status,
      assignedToMembershipId: query.assignedToMembershipId,
      leadId: query.leadId,
      skip,
      take,
      sort,
    });
    return { items, pageInfo: { page, pageSize, total, hasNextPage: skip + items.length < total } };
  }

  @Get(":id")
  async get(@Req() req: Request, @Param("id") id: string) {
    const { agencyId, role, membershipId } = getAuthContext(req);
    return this.tasks.get({ agencyId, actor: { role, membershipId }, id });
  }

  @Patch(":id")
  @Roles(...ROLES_MUTATE)
  async update(@Req() req: Request, @Param("id") id: string, @Body() dto: UpdateTaskDto) {
    const { agencyId, membershipId, role } = getAuthContext(req);
    return this.tasks.update({
      agencyId,
      actor: { role, membershipId },
      actorMembershipId: membershipId,
      id,
      data: dto,
    });
  }

  @Delete(":id")
  @Roles(...ROLES_MUTATE)
  async delete(@Req() req: Request, @Param("id") id: string) {
    const { agencyId, membershipId, role } = getAuthContext(req);
    return this.tasks.delete({ agencyId, actor: { role, membershipId }, actorMembershipId: membershipId, id });
  }
}

