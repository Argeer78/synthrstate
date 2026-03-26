import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { TenantGuard } from "../auth/guards/tenant.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";
import { UserRole } from "@prisma/client";

@Controller("admin")
export class AdminController {
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Get("health")
  getAdminHealth() {
    return { ok: true };
  }
}

