"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMe } from "../../lib/use-me";
import { FlashMessage, type Flash } from "../components/Flash";
import { createCheckoutSession, createCustomerPortalSession, getBillingSubscription, type BillingPlanPublicCode, type BillingSubscriptionResponse } from "../../lib/api/billing";

function money(amountCents: number | null, currency: string) {
  if (amountCents == null) return "Custom";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency, minimumFractionDigits: 0 }).format(amountCents / 100);
}

export function BillingClient() {
  const { role } = useMe();
  const params = useSearchParams();
  const [flash, setFlash] = useState<Flash>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BillingSubscriptionResponse | null>(null);
  const [busy, setBusy] = useState<null | "starter" | "growth" | "portal">(null);

  const isOwner = role === "OWNER";

  async function refresh() {
    setLoading(true);
    try {
      const d = await getBillingSubscription();
      setData(d);
    } catch (e) {
      setFlash({ type: "error", message: e instanceof Error ? e.message : "Failed to load billing." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh().catch(() => {});
  }, []);

  useEffect(() => {
    const status = params?.get("checkout");
    if (status === "success") setFlash({ type: "success", message: "Checkout complete. Subscription is updating now." });
    if (status === "cancel") setFlash({ type: "info", message: "Checkout canceled. No changes were made." });
  }, [params]);

  const currentPlan = useMemo(() => data?.subscription?.planCode ?? null, [data]);

  if (loading) return <p className="admin-lead">Loading billing…</p>;
  if (!data) return <p className="admin-lead">Billing data unavailable.</p>;

  return (
    <div style={{ display: "grid", gap: "1rem", marginTop: "1.25rem" }}>
      <FlashMessage flash={flash} onDismiss={() => setFlash(null)} />

      <section className="admin-card" style={{ maxWidth: "none", padding: "1rem" }}>
        <h2 style={{ margin: 0, fontSize: "1rem" }}>Current subscription</h2>
        {data.subscription ? (
          <div style={{ marginTop: "0.6rem", display: "grid", gap: "0.35rem" }}>
            <p className="admin-lead" style={{ margin: 0 }}>
              Plan: <strong style={{ color: "var(--admin-text)" }}>{data.subscription.planName}</strong>
            </p>
            <p className="admin-lead" style={{ margin: 0 }}>
              Status: <code>{data.subscription.status}</code>
            </p>
            <p className="admin-lead" style={{ margin: 0 }}>
              Renewal: {data.subscription.currentPeriodEnd ? String(data.subscription.currentPeriodEnd).slice(0, 10) : "—"}
            </p>
          </div>
        ) : (
          <p className="admin-lead" style={{ marginTop: "0.6rem", marginBottom: 0 }}>
            No active subscription yet.
          </p>
        )}

        <div style={{ marginTop: "0.8rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {isOwner ? (
            <button
              className="admin-btn admin-btn-ghost"
              type="button"
              disabled={busy != null}
              onClick={async () => {
                try {
                  setBusy("portal");
                  const { url } = await createCustomerPortalSession();
                  if (url) window.location.href = url;
                } catch (e) {
                  setFlash({ type: "error", message: e instanceof Error ? e.message : "Failed to open billing portal." });
                } finally {
                  setBusy(null);
                }
              }}
            >
              {busy === "portal" ? "Opening…" : "Manage subscription"}
            </button>
          ) : (
            <p className="admin-lead" style={{ margin: 0 }}>
              Managers have read-only billing access.
            </p>
          )}
        </div>
      </section>

      <section className="admin-card" style={{ maxWidth: "none", padding: "1rem" }}>
        <h2 style={{ margin: 0, fontSize: "1rem" }}>Plans</h2>
        <div style={{ marginTop: "0.75rem", display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "0.75rem" }}>
          {data.plans.map((p) => (
            <article key={p.code} style={{ border: "1px solid var(--admin-border)", borderRadius: "0.9rem", padding: "0.85rem" }}>
              <p style={{ margin: 0, fontWeight: 700, color: "var(--admin-text)" }}>{p.name}</p>
              <p className="admin-lead" style={{ margin: "0.35rem 0 0" }}>
                {money(p.amountCents, p.currency)}{p.amountCents != null ? "/month" : ""}
              </p>
              {p.code === "CUSTOM" ? (
                <p className="admin-lead" style={{ margin: "0.45rem 0 0" }}>
                  Contact us at <a href={`mailto:${data.supportEmail}`} className="admin-link">{data.supportEmail}</a>
                </p>
              ) : isOwner ? (
                <button
                  className="admin-btn admin-btn-primary"
                  type="button"
                  style={{ marginTop: "0.6rem", minHeight: "2.25rem", width: "100%" }}
                  disabled={busy != null || currentPlan === p.code}
                  onClick={async () => {
                    try {
                      setBusy(p.code === "STARTER" ? "starter" : "growth");
                      const { url } = await createCheckoutSession(p.code as Exclude<BillingPlanPublicCode, "CUSTOM">);
                      if (!url) throw new Error("Missing checkout URL");
                      window.location.href = url;
                    } catch (e) {
                      setFlash({ type: "error", message: e instanceof Error ? e.message : "Failed to start checkout." });
                    } finally {
                      setBusy(null);
                    }
                  }}
                >
                  {currentPlan === p.code ? "Current plan" : "Choose plan"}
                </button>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

