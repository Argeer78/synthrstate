"use client";

import Link from "next/link";
import { useMe } from "../lib/use-me";
import { canAccessAi, canAccessBilling, canManageUsers } from "../utils/permissions";
import { normalizeMe } from "../lib/normalize-me";

export function AdminSidebar() {
  const { state, role } = useMe();

  return (
    <aside
      className="admin-card"
      style={{
        padding: "1rem",
        maxWidth: "none",
        height: "fit-content",
        position: "sticky",
        top: "1rem",
      }}
    >
      <div style={{ marginBottom: "0.75rem" }}>
        <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--admin-muted)", fontWeight: 600 }}>Workspace</p>
        {state.status === "ok" ? (
          (() => {
            const m = normalizeMe(state.me);
            return (
              <>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.9rem", color: "var(--admin-text)" }}>{m.emailLine}</p>
                <p style={{ margin: "0.15rem 0 0", fontSize: "0.78rem", color: "var(--admin-muted)" }}>{m.subLine}</p>
              </>
            );
          })()
        ) : (
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "var(--admin-muted)" }}>
            {state.status === "loading" ? "Checking session…" : "Not signed in"}
          </p>
        )}
      </div>

      <nav aria-label="Admin navigation" style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <Link className="admin-btn admin-btn-ghost" href="/">
          Home
        </Link>
        <Link className="admin-btn admin-btn-ghost" href="/listings/">
          Listings
        </Link>
        <Link className="admin-btn admin-btn-ghost" href="/crm/">
          CRM
        </Link>

        {canAccessAi(role) ? (
          <Link className="admin-btn admin-btn-ghost" href="/ai/">
            AI
          </Link>
        ) : null}

        {canManageUsers(role) ? (
          <Link className="admin-btn admin-btn-ghost" href="/users/">
            User management
          </Link>
        ) : null}

        {canAccessBilling(role) ? (
          <Link className="admin-btn admin-btn-ghost" href="/billing/">
            Billing
          </Link>
        ) : null}
      </nav>
    </aside>
  );
}

