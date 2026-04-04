"use client";

import Link from "next/link";
import { useMe } from "../../lib/use-me";
import { shouldShowSubscriptionPaywall } from "../../lib/subscription-ui";

export function SubscriptionPaywallBanner() {
  const { state } = useMe();

  if (state.status !== "ok") return null;
  if (!shouldShowSubscriptionPaywall(state.me)) return null;

  return (
    <div
      className="admin-card-nested"
      style={{
        marginBottom: "1rem",
        padding: "0.9rem 1rem",
        border: "1px solid rgba(251, 191, 36, 0.45)",
        background: "rgba(251, 191, 36, 0.08)",
        borderRadius: "0.75rem",
      }}
      role="status"
    >
      <p className="admin-lead" style={{ margin: 0, fontWeight: 700 }}>
        Your free trial has ended.
      </p>
      <p className="admin-lead" style={{ margin: "0.35rem 0 0.75rem", fontSize: "0.9rem" }}>
        Subscribe to continue.{" "}
        <Link href="/billing/" className="admin-link" style={{ fontWeight: 700 }}>
          Open billing
        </Link>
      </p>
    </div>
  );
}
