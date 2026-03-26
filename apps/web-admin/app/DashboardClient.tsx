"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMe } from "../lib/use-me";
import { fetchDashboard } from "../lib/api/dashboard";
import { FlashMessage, type Flash } from "./components/Flash";
import { canCreate, canEdit, canPublish, isViewer } from "../utils/permissions";

function Card(props: { label: string; value: number | string; href: string }) {
  return (
    <Link
      href={props.href}
      className="admin-btn admin-btn-ghost"
      style={{
        display: "flex",
        alignItems: "stretch",
        justifyContent: "space-between",
        gap: "0.75rem",
        padding: "0.9rem 1rem",
        borderRadius: "0.9rem",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span style={{ fontSize: "0.8rem", color: "var(--admin-muted)", fontWeight: 700 }}>{props.label}</span>
        <span style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--admin-text)", lineHeight: 1.1 }}>{props.value}</span>
      </div>
      <span style={{ color: "var(--admin-muted)", alignSelf: "center" }}>→</span>
    </Link>
  );
}

export function DashboardClient() {
  const { state: meState, role } = useMe();
  const [flash, setFlash] = useState<Flash>(null);
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "ok"; data: Awaited<ReturnType<typeof fetchDashboard>> }
  >({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchDashboard();
        if (!cancelled) setState({ status: "ok", data });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to load dashboard.";
        if (!cancelled) setState({ status: "error", message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const scopeLabel = useMemo(() => {
    if (!role) return "Overview";
    if (role === "OWNER" || role === "MANAGER") return "Agency overview";
    if (role === "AGENT") return "My overview";
    return "Read-only overview";
  }, [role]);

  if (meState.status !== "ok") {
    return (
      <div>
        <p className="admin-lead">Sign in to see your dashboard.</p>
        <Link href="/login/" className="admin-btn admin-btn-primary">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <FlashMessage flash={flash} onDismiss={() => setFlash(null)} />

      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <p className="admin-lead" style={{ margin: 0 }}>
            {scopeLabel}
          </p>
          {isViewer(role) ? (
            <p className="admin-lead" style={{ margin: "0.35rem 0 0" }}>
              You have read-only access.
            </p>
          ) : null}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Link href="/crm/" className="admin-btn admin-btn-ghost" style={{ minHeight: "2.5rem" }}>
            View inquiries
          </Link>
          <Link href="/listings/" className="admin-btn admin-btn-ghost" style={{ minHeight: "2.5rem" }}>
            View listings
          </Link>
          {canCreate(role) ? (
            <Link href="/crm/?new=contact" className="admin-btn admin-btn-primary" style={{ minHeight: "2.5rem" }}>
              New contact
            </Link>
          ) : null}
          {canCreate(role) ? (
            <Link href="/crm/?new=lead" className="admin-btn admin-btn-ghost" style={{ minHeight: "2.5rem" }}>
              New lead
            </Link>
          ) : null}
          {canCreate(role) ? (
            <Link href="/listings/?new=listing" className="admin-btn admin-btn-ghost" style={{ minHeight: "2.5rem" }}>
              New listing
            </Link>
          ) : null}
        </div>
      </div>

      {state.status === "loading" ? <p className="admin-lead">Loading dashboard…</p> : null}
      {state.status === "error" ? (
        <p className="admin-lead" style={{ color: "#ffb4b4" }}>
          {state.message}
        </p>
      ) : null}

      {state.status === "ok" ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: "0.75rem" }}>
            <Card label="Contacts" value={state.data.counts.totalContacts} href="/crm/" />
            <Card label="Leads" value={state.data.counts.totalLeads} href="/crm/" />
            <Card label="New inquiries" value={state.data.counts.newInquiries} href="/crm/" />
            <Card label="Active listings" value={state.data.counts.activeListings} href="/listings/" />
            <Card label="Tasks due soon" value={state.data.counts.tasksDueSoon} href="/crm/" />
          </div>

          <section style={{ marginTop: "0.5rem" }}>
            <h2 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>Recent activity</h2>
            <p className="admin-lead" style={{ marginTop: 0 }}>
              Latest events across your workspace (role-scoped).
            </p>
            <div style={{ border: "1px solid var(--admin-border)", borderRadius: "0.9rem", overflow: "hidden" }}>
              {state.data.recent.length === 0 ? (
                <p className="admin-lead" style={{ margin: 0, padding: "0.9rem 1rem" }}>
                  No recent activity yet.
                </p>
              ) : (
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {state.data.recent.map((r, idx) => (
                    <li
                      key={`${r.type}-${r.at}-${idx}`}
                      style={{
                        padding: "0.85rem 1rem",
                        borderTop: idx === 0 ? "none" : "1px solid rgba(255,255,255,0.06)",
                        display: "flex",
                        gap: "1rem",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        {r.entityType === "LEAD" && r.entityId ? (
                          <p style={{ margin: 0, color: "var(--admin-text)", fontWeight: 650 }}>
                            <Link href={`/crm/lead/?id=${encodeURIComponent(r.entityId)}`} className="admin-link">
                              {r.title}
                            </Link>
                          </p>
                        ) : r.entityType === "LISTING" && r.entityId ? (
                          <p style={{ margin: 0, color: "var(--admin-text)", fontWeight: 650 }}>
                            <Link href={`/listings/view/?id=${encodeURIComponent(r.entityId)}`} className="admin-link">
                              {r.title}
                            </Link>
                          </p>
                        ) : (
                          <p style={{ margin: 0, color: "var(--admin-text)", fontWeight: 650 }}>{r.title}</p>
                        )}
                        {r.subtitle ? (
                          <p style={{ margin: "0.2rem 0 0", color: "var(--admin-muted)", fontSize: "0.85rem" }}>{r.subtitle}</p>
                        ) : null}
                      </div>
                      <time style={{ color: "var(--admin-muted)", fontSize: "0.8rem", flexShrink: 0 }}>
                        {String(r.at).slice(0, 19).replace("T", " ")}
                      </time>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

