import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { TenantGuard } from "../auth/guards/tenant.guard";

@Controller("me")
export class MeController {
  @UseGuards(JwtAuthGuard, TenantGuard)
  @Get()
  getMe(@Req() req: Request) {
    return { user: req.user };
  }
}

