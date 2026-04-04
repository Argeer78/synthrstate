import type { MeResponse } from "./me";

/**
 * True when the admin UI should show the subscription / trial paywall banner.
 * Mirrors API write entitlement for TRIALING/ACTIVE; never for platform superadmins.
 */
export function shouldShowSubscriptionPaywall(me: MeResponse | null | undefined): boolean {
  if (!me) return false;
  if (me.session?.superadmin) return false;

  const sub = me.subscription;
  if (!sub) return true;

  if (sub.status === "ACTIVE") return false;

  if (sub.status === "TRIALING") {
    const endRaw = sub.trialEndsAt ?? sub.currentPeriodEnd;
    if (!endRaw) return false;
    return new Date(endRaw).getTime() <= Date.now();
  }

  return true;
}
