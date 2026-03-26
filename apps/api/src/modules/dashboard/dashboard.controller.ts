import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { TenantGuard } from "../auth/guards/tenant.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { getAuthContext } from "../crm/shared/tenant.req";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  async get(@Req() req: Request) {
    const { agencyId, role, membershipId } = getAuthContext(req);
    return this.dashboard.getDashboard({
      agencyId,
      actor: { role, membershipId },
    });
  }
}

