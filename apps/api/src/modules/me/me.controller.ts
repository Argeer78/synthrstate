import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { TenantGuard } from "../auth/guards/tenant.guard";
import type { JwtClaims } from "../auth/auth.types";
import { PrismaService } from "../../prisma/prisma.service";

@Controller("me")
export class MeController {
  constructor(private readonly prisma: PrismaService) {}

  @UseGuards(JwtAuthGuard, TenantGuard)
  @Get()
  async getMe(@Req() req: Request) {
    const claims = req.user as JwtClaims;

    const [user, agency] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: claims.sub },
        select: { id: true, email: true, fullName: true },
      }),
      this.prisma.agency.findUnique({
        where: { id: claims.agencyId },
        select: { id: true, slug: true, name: true },
      }),
    ]);

    return {
      user,
      agency,
      membership: { id: claims.membershipId, role: claims.role },
    };
  }
}
