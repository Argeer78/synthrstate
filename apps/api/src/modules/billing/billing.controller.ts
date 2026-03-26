import { Body, Controller, Get, Headers, Post, RawBodyRequest, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { UserRole } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { TenantGuard } from "../auth/guards/tenant.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { getAuthContext } from "../crm/shared/tenant.req";
import { BillingService } from "./billing.service";
import { CreateCheckoutSessionDto, CreatePortalSessionDto } from "./dto/billing.dto";

@Controller("billing")
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Get("subscription")
  async getSubscription(@Req() req: Request) {
    const { agencyId } = getAuthContext(req);
    return this.billing.getSubscription({ agencyId });
  }

  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @Post("checkout-session")
  async createCheckout(@Req() req: Request, @Body() dto: CreateCheckoutSessionDto) {
    const { agencyId, userId } = getAuthContext(req);
    return this.billing.createCheckoutSession({ agencyId, actorUserId: userId, plan: dto.plan });
  }

  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @Post("customer-portal-session")
  async createPortal(@Req() req: Request, @Body() dto: CreatePortalSessionDto) {
    const { agencyId } = getAuthContext(req);
    return this.billing.createPortalSession({ agencyId, returnUrl: dto.returnUrl });
  }

  @Post("webhook")
  async webhook(@Headers("stripe-signature") signature: string | undefined, @Req() req: RawBodyRequest<Request>) {
    return this.billing.handleWebhook(signature, req.rawBody);
  }
}

