import { apiFetch } from "../admin-api";
import { readApiError } from "./errors";

export type BillingPlanPublicCode = "STARTER" | "GROWTH" | "CUSTOM";

export type BillingSubscriptionResponse = {
  subscription: {
    planCode: BillingPlanPublicCode;
    planName: string;
    status: string;
    currentPeriodEnd?: string | null;
    cancelAtPeriodEnd?: boolean;
    stripeCustomerId?: string | null;
  } | null;
  plans: { code: BillingPlanPublicCode; name: string; amountCents: number | null; currency: string }[];
  supportEmail: string;
};

export async function getBillingSubscription() {
  const res = await apiFetch("/billing/subscription", { method: "GET" });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as BillingSubscriptionResponse;
}

export async function createCheckoutSession(plan: "STARTER" | "GROWTH") {
  const res = await apiFetch("/billing/checkout-session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ plan }),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as { url?: string | null; id: string };
}

export async function createCustomerPortalSession(returnUrl?: string) {
  const res = await apiFetch("/billing/customer-portal-session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ returnUrl }),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as { url: string };
}

