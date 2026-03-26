import { BadRequestException, Injectable } from "@nestjs/common";
import { AgencySubscriptionStatus, Prisma, StripeWebhookEventType, SubscriptionPlanCode } from "@prisma/client";
import Stripe from "stripe";
import { PrismaService } from "../../prisma/prisma.service";
import { BILLING_PLAN_CONFIG, getPlanByInternalCode, getPlanByPublicCode } from "./billing.constants";

@Injectable()
export class BillingService {
  private stripe: Stripe;
  private webhookSecret: string;
  private adminAppUrl: string;
  private supportEmail: string;

  constructor(private readonly prisma: PrismaService) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is required");
    this.stripe = new Stripe(key);
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
    this.adminAppUrl = (process.env.ADMIN_APP_URL ?? process.env.NEXT_PUBLIC_ADMIN_URL ?? "https://app.synthrstate.com").replace(/\/$/, "");
    this.supportEmail = process.env.BILLING_SUPPORT_EMAIL ?? "hello@synthrstate.com";
  }

  async getSubscription(params: { agencyId: string }) {
    const subscription = await this.prisma.agencySubscription.findUnique({
      where: { agencyId: params.agencyId },
      include: { plan: true },
    });
    const planInfo = getPlanByInternalCode(subscription?.planCode ?? null);
    return {
      subscription: subscription
        ? {
            planCode: planInfo?.publicCode ?? "CUSTOM",
            planName: planInfo?.name ?? subscription.planCode,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            stripeCustomerId: subscription.stripeCustomerId,
          }
        : null,
      plans: BILLING_PLAN_CONFIG.map((p) => ({
        code: p.publicCode,
        name: p.name,
        amountCents: p.amountCents,
        currency: p.currency,
      })),
      supportEmail: this.supportEmail,
    };
  }

  async createCheckoutSession(params: { agencyId: string; actorUserId: string; plan: "STARTER" | "GROWTH" }) {
    const plan = getPlanByPublicCode(params.plan);
    if (!plan || !plan.stripePriceEnv) throw new BadRequestException("Unsupported plan");
    const priceId = process.env[plan.stripePriceEnv];
    if (!priceId) throw new BadRequestException(`${plan.stripePriceEnv} is not configured`);

    await this.ensurePlanExists(plan.code);

    const agency = await this.prisma.agency.findUnique({
      where: { id: params.agencyId },
      select: { id: true, name: true, slug: true },
    });
    if (!agency) throw new BadRequestException("Agency not found");

    const existing = await this.prisma.agencySubscription.findUnique({
      where: { agencyId: params.agencyId },
      select: { stripeCustomerId: true },
    });

    let customerId = existing?.stripeCustomerId ?? null;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        name: agency.name,
        metadata: { agencyId: agency.id, agencySlug: agency.slug },
      });
      customerId = customer.id;
    }

    const successUrl = `${this.adminAppUrl}/billing/?checkout=success`;
    const cancelUrl = `${this.adminAppUrl}/billing/?checkout=cancel`;

    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: agency.id,
      metadata: {
        agencyId: agency.id,
        planCode: plan.code,
        publicPlanCode: plan.publicCode,
        actorUserId: params.actorUserId,
      },
      subscription_data: {
        metadata: {
          agencyId: agency.id,
          planCode: plan.code,
          publicPlanCode: plan.publicCode,
        },
      },
      allow_promotion_codes: false,
    });

    await this.prisma.agencySubscription.upsert({
      where: { agencyId: agency.id },
      update: {
        planCode: plan.code,
        stripeCustomerId: customerId,
      },
      create: {
        agencyId: agency.id,
        planCode: plan.code,
        status: AgencySubscriptionStatus.INCOMPLETE,
        stripeCustomerId: customerId,
      },
    });

    return { url: session.url, id: session.id };
  }

  async createPortalSession(params: { agencyId: string; returnUrl?: string }) {
    const subscription = await this.prisma.agencySubscription.findUnique({
      where: { agencyId: params.agencyId },
      select: { stripeCustomerId: true },
    });
    if (!subscription?.stripeCustomerId) throw new BadRequestException("No Stripe customer for this agency yet");

    const session = await this.stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: params.returnUrl?.trim() || `${this.adminAppUrl}/billing/`,
    });
    return { url: session.url };
  }

  async handleWebhook(signature: string | undefined, rawBody: Buffer | undefined) {
    if (!this.webhookSecret) throw new BadRequestException("STRIPE_WEBHOOK_SECRET is not configured");
    if (!signature || !rawBody) throw new BadRequestException("Missing Stripe signature/body");

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
    } catch (e) {
      throw new BadRequestException("Invalid Stripe webhook signature");
    }

    const existing = await this.prisma.stripeWebhookEvent.findUnique({ where: { stripeEventId: event.id }, select: { id: true } });
    if (existing) return { ok: true, duplicate: true };

    const baseEventType = this.mapStripeEventType(event.type);
    await this.prisma.stripeWebhookEvent.create({
      data: {
        stripeEventId: event.id,
        eventType: baseEventType,
        payload: JSON.parse(JSON.stringify(event)) as Prisma.JsonObject,
      },
    });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await this.applyCheckoutCompleted(session);
    } else if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      await this.applySubscriptionUpdate(sub);
    }

    await this.prisma.stripeWebhookEvent.update({
      where: { stripeEventId: event.id },
      data: { processedAt: new Date() },
    });

    return { ok: true };
  }

  private async applyCheckoutCompleted(session: Stripe.Checkout.Session) {
    const agencyId = session.metadata?.agencyId ?? session.client_reference_id ?? undefined;
    if (!agencyId) return;

    let subscriptionData: Stripe.Subscription | null = null;
    if (typeof session.subscription === "string") {
      subscriptionData = await this.stripe.subscriptions.retrieve(session.subscription);
    }

    const planCode = this.resolvePlanCodeFromSubscription(subscriptionData) ?? this.resolvePlanCodeFromMetadata(session.metadata);
    const safePlan = planCode ?? SubscriptionPlanCode.STARTER;
    await this.ensurePlanExists(safePlan);

    await this.prisma.agencySubscription.upsert({
      where: { agencyId },
      update: {
        planCode: safePlan,
        stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined,
        stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : undefined,
        status: this.mapSubscriptionStatus(subscriptionData?.status ?? "active"),
        currentPeriodEnd: this.subscriptionPeriodEnd(subscriptionData),
        cancelAtPeriodEnd: Boolean(subscriptionData?.cancel_at_period_end),
      },
      create: {
        agencyId,
        planCode: safePlan,
        stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined,
        stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : undefined,
        status: this.mapSubscriptionStatus(subscriptionData?.status ?? "active"),
        currentPeriodEnd: this.subscriptionPeriodEnd(subscriptionData),
        cancelAtPeriodEnd: Boolean(subscriptionData?.cancel_at_period_end),
      },
    });
  }

  private async applySubscriptionUpdate(sub: Stripe.Subscription) {
    const agencyId =
      sub.metadata?.agencyId ??
      (await this.prisma.agencySubscription.findFirst({
        where: { stripeSubscriptionId: sub.id },
        select: { agencyId: true },
      }))?.agencyId;
    if (!agencyId) return;

    const planCode = this.resolvePlanCodeFromSubscription(sub) ?? this.resolvePlanCodeFromMetadata(sub.metadata) ?? SubscriptionPlanCode.STARTER;
    await this.ensurePlanExists(planCode);

    await this.prisma.agencySubscription.upsert({
      where: { agencyId },
      update: {
        planCode,
        stripeCustomerId: typeof sub.customer === "string" ? sub.customer : undefined,
        stripeSubscriptionId: sub.id,
        status: this.mapSubscriptionStatus(sub.status),
        currentPeriodEnd: this.subscriptionPeriodEnd(sub),
        cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
      },
      create: {
        agencyId,
        planCode,
        stripeCustomerId: typeof sub.customer === "string" ? sub.customer : undefined,
        stripeSubscriptionId: sub.id,
        status: this.mapSubscriptionStatus(sub.status),
        currentPeriodEnd: this.subscriptionPeriodEnd(sub),
        cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
      },
    });
  }

  private resolvePlanCodeFromSubscription(sub: Stripe.Subscription | null | undefined): SubscriptionPlanCode | null {
    if (!sub) return null;
    const priceIds = sub.items.data.map((i) => i.price.id);
    for (const plan of BILLING_PLAN_CONFIG) {
      if (!plan.stripePriceEnv) continue;
      const priceId = process.env[plan.stripePriceEnv];
      if (priceId && priceIds.includes(priceId)) return plan.code;
    }
    return this.resolvePlanCodeFromMetadata(sub.metadata);
  }

  private resolvePlanCodeFromMetadata(metadata: Record<string, string> | null | undefined): SubscriptionPlanCode | null {
    const value = metadata?.planCode;
    if (value === SubscriptionPlanCode.STARTER || value === SubscriptionPlanCode.PRO || value === SubscriptionPlanCode.ENTERPRISE) {
      return value;
    }
    return null;
  }

  private mapSubscriptionStatus(status: Stripe.Subscription.Status): AgencySubscriptionStatus {
    switch (status) {
      case "trialing":
        return AgencySubscriptionStatus.TRIALING;
      case "active":
        return AgencySubscriptionStatus.ACTIVE;
      case "past_due":
        return AgencySubscriptionStatus.PAST_DUE;
      case "canceled":
        return AgencySubscriptionStatus.CANCELED;
      case "unpaid":
        return AgencySubscriptionStatus.UNPAID;
      case "incomplete":
        return AgencySubscriptionStatus.INCOMPLETE;
      case "incomplete_expired":
        return AgencySubscriptionStatus.INCOMPLETE_EXPIRED;
      default:
        return AgencySubscriptionStatus.INCOMPLETE;
    }
  }

  private mapStripeEventType(type: string): StripeWebhookEventType {
    switch (type) {
      case "checkout.session.completed":
        return StripeWebhookEventType.CHECKOUT_SESSION_COMPLETED;
      case "customer.subscription.updated":
        return StripeWebhookEventType.CUSTOMER_SUBSCRIPTION_UPDATED;
      case "customer.subscription.deleted":
        return StripeWebhookEventType.CUSTOMER_SUBSCRIPTION_DELETED;
      default:
        return StripeWebhookEventType.UNKNOWN;
    }
  }

  private subscriptionPeriodEnd(sub: Stripe.Subscription | null | undefined): Date | null {
    const ts = (sub as any)?.current_period_end as number | undefined;
    return typeof ts === "number" ? new Date(ts * 1000) : null;
  }

  private async ensurePlanExists(code: SubscriptionPlanCode) {
    const config = BILLING_PLAN_CONFIG.find((p) => p.code === code);
    const amountCents = config?.amountCents ?? null;
    const stripePriceId = config?.stripePriceEnv ? process.env[config.stripePriceEnv] ?? null : null;
    await this.prisma.subscriptionPlan.upsert({
      where: { code },
      update: {
        name: config?.name ?? code,
        amountCents: amountCents ?? undefined,
        currency: "EUR",
        seatLimit: config?.seatLimit ?? 1,
        features: config?.features ?? [],
        stripePriceIdMonthly: stripePriceId ?? undefined,
      },
      create: {
        code,
        name: config?.name ?? code,
        amountCents: amountCents ?? undefined,
        currency: "EUR",
        seatLimit: config?.seatLimit ?? 1,
        features: config?.features ?? [],
        stripePriceIdMonthly: stripePriceId ?? undefined,
      },
    });
  }
}

