import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { ROLES_READ } from "../auth/rbac.constants";
import { getAuthContext } from "../crm/shared/tenant.req";
import { ListNotificationsQueryDto, MarkReadDto } from "./dto/notifications.dto";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @Roles(...ROLES_READ)
  async list(@Req() req: Request, @Query() query: ListNotificationsQueryDto) {
    const ctx = getAuthContext(req);
    const take = query.take ?? 25;
    return await this.notifications.list({ agencyId: ctx.agencyId, membershipId: ctx.membershipId, take });
  }

  @Post("mark-read")
  @Roles(...ROLES_READ)
  async markRead(@Req() req: Request, @Body() dto: MarkReadDto) {
    const ctx = getAuthContext(req);
    return await this.notifications.markRead({ agencyId: ctx.agencyId, membershipId: ctx.membershipId, ids: dto.ids ?? [] });
  }
}

