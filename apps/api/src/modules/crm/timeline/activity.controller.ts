import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { TenantGuard } from "../../auth/guards/tenant.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { activityScopeWhere } from "../../auth/rbac-query.util";
import { getAuthContext } from "../shared/tenant.req";
import { PaginationDto, getPagination } from "../shared/pagination.dto";
import { IsOptional, IsString } from "class-validator";

class ActivityQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  contactId?: string;

  @IsOptional()
  @IsString()
  leadId?: string;

  @IsOptional()
  @IsString()
  entityId?: string;
}

@Controller("crm/activity")
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class ActivityController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Req() req: Request, @Query() query: ActivityQueryDto) {
    const { agencyId, role, membershipId } = getAuthContext(req);
    const { skip, take, page, pageSize } = getPagination(query);

    const where: Prisma.ActivityEventWhereInput = {
      agencyId,
      ...activityScopeWhere({ role, membershipId }),
    };
    if (query.contactId) where.contactId = query.contactId;
    if (query.leadId) where.leadId = query.leadId;
    if (query.entityId) where.entityId = query.entityId;

    const [items, total] = await Promise.all([
      this.prisma.activityEvent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      this.prisma.activityEvent.count({ where }),
    ]);

    return {
      items,
      pageInfo: { page, pageSize, total, hasNextPage: skip + items.length < total },
    };
  }
}

