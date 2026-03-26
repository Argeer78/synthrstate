import { SubscriptionPlanCode } from "@prisma/client";

export type BillingPlanConfig = {
  code: SubscriptionPlanCode;
  publicCode: "STARTER" | "GROWTH" | "CUSTOM";
  name: string;
  amountCents: number | null;
  currency: "EUR";
  stripePriceEnv?: string;
  seatLimit: number;
  features: string[];
};

export const BILLING_PLAN_CONFIG: BillingPlanConfig[] = [
  {
    code: SubscriptionPlanCode.STARTER,
    publicCode: "STARTER",
    name: "Starter",
    amountCents: 4900,
    currency: "EUR",
    stripePriceEnv: "STRIPE_PRICE_STARTER_MONTHLY",
    seatLimit: 3,
    features: ["CRM core", "Listings core", "Basic support"],
  },
  {
    // Growth maps to existing enum PRO in current schema.
    code: SubscriptionPlanCode.PRO,
    publicCode: "GROWTH",
    name: "Growth",
    amountCents: 12900,
    currency: "EUR",
    stripePriceEnv: "STRIPE_PRICE_GROWTH_MONTHLY",
    seatLimit: 15,
    features: ["Unlimited listings", "AI features", "Priority support"],
  },
  {
    code: SubscriptionPlanCode.ENTERPRISE,
    publicCode: "CUSTOM",
    name: "Custom",
    amountCents: null,
    currency: "EUR",
    seatLimit: 999,
    features: ["Custom onboarding", "Enterprise support", "Custom integrations"],
  },
];

export function getPlanByPublicCode(code: string | undefined) {
  return BILLING_PLAN_CONFIG.find((p) => p.publicCode === code);
}

export function getPlanByInternalCode(code: SubscriptionPlanCode | null | undefined) {
  if (!code) return undefined;
  return BILLING_PLAN_CONFIG.find((p) => p.code === code);
}

