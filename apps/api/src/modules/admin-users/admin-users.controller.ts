import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { TenantGuard } from "../auth/guards/tenant.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { UserRole } from "@prisma/client";
import { getAuthContext } from "../crm/shared/tenant.req";
import { getPagination, PaginationDto } from "../crm/shared/pagination.dto";
import { AdminUsersService } from "./admin-users.service";
import { CreateTeamMemberDto } from "./dto/create-team-member.dto";
import { UpdateTeamMemberDto } from "./dto/update-team-member.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

@Controller("admin/users")
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class AdminUsersController {
  constructor(private readonly users: AdminUsersService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async list(@Req() req: Request, @Query() query: PaginationDto) {
    const { agencyId, role, membershipId } = getAuthContext(req);
    const { skip, take } = getPagination(query);
    return this.users.list({ agencyId, actor: { role, membershipId }, skip, take });
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async create(@Req() req: Request, @Body() dto: CreateTeamMemberDto) {
    const { agencyId, role, membershipId } = getAuthContext(req);
    return this.users.create({ agencyId, actor: { role, membershipId }, actorMembershipId: membershipId, data: dto });
  }

  @Patch(":membershipId")
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async update(
    @Req() req: Request,
    @Param("membershipId", new ParseUUIDPipe({ version: "4" })) membershipId: string,
    @Body() dto: UpdateTeamMemberDto,
  ) {
    const { agencyId, role, membershipId: actorMembershipId } = getAuthContext(req);
    return this.users.update({ agencyId, actor: { role, membershipId: actorMembershipId }, actorMembershipId, membershipId, data: dto });
  }

  @Post(":membershipId/reset-password")
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async resetPassword(
    @Req() req: Request,
    @Param("membershipId", new ParseUUIDPipe({ version: "4" })) membershipId: string,
    @Body() dto: ResetPasswordDto,
  ) {
    const { agencyId, role, membershipId: actorMembershipId } = getAuthContext(req);
    return this.users.resetPassword({
      agencyId,
      actor: { role, membershipId: actorMembershipId },
      actorMembershipId,
      membershipId,
      newPassword: dto.newPassword,
      force: dto.force,
    });
  }
}

