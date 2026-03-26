import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { TenantGuard } from "../../auth/guards/tenant.guard";
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
  async create(@Req() req: Request, @Body() dto: CreateTaskDto) {
    const { agencyId, membershipId } = getAuthContext(req);
    return this.tasks.create({ agencyId, actorMembershipId: membershipId, data: dto });
  }

  @Get()
  async list(@Req() req: Request, @Query() query: TaskListQueryDto) {
    const { agencyId } = getAuthContext(req);
    const { skip, take, page, pageSize } = getPagination(query);
    const sort = query.sort === "dueAt" ? "dueAt" : "createdAt";
    const { items, total } = await this.tasks.list({
      agencyId,
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
    const { agencyId } = getAuthContext(req);
    return this.tasks.get({ agencyId, id });
  }

  @Patch(":id")
  async update(@Req() req: Request, @Param("id") id: string, @Body() dto: UpdateTaskDto) {
    const { agencyId, membershipId } = getAuthContext(req);
    return this.tasks.update({ agencyId, actorMembershipId: membershipId, id, data: dto });
  }

  @Delete(":id")
  async delete(@Req() req: Request, @Param("id") id: string) {
    const { agencyId, membershipId } = getAuthContext(req);
    return this.tasks.delete({ agencyId, actorMembershipId: membershipId, id });
  }
}

