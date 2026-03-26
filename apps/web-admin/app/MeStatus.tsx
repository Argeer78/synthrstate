"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { normalizeMe } from "../lib/normalize-me";

type MeResponse = Record<string, unknown>;

export function MeStatus() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "anon" }
    | { status: "ok"; raw: MeResponse }
    | { status: "error"; message: string }
  >({ status: "loading" });

  useEffect(() => {
    if (!apiBase) {
      setState({ status: "error", message: "API URL is not configured." });
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${apiBase}/me`, {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          if (!cancelled) setState({ status: "anon" });
          return;
        }

        const raw = (await res.json()) as MeResponse;
        if (!cancelled) setState({ status: "ok", raw });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load session.";
        if (!cancelled) setState({ status: "error", message });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apiBase]);

  async function signOut() {
    if (!apiBase) return;
    await fetch(`${apiBase}/auth/logout`, { method: "POST", credentials: "include" });
    setState({ status: "anon" });
  }

  if (state.status === "loading") {
    return <p className="admin-lead">Checking session...</p>;
  }

  if (state.status === "ok") {
    const m = normalizeMe(state.raw);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div>
          <p className="admin-lead" style={{ marginBottom: "0.35rem" }}>
            Signed in as{" "}
            <strong style={{ color: "var(--admin-text)" }}>{m.emailLine}</strong>
          </p>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--admin-muted)" }}>
            {m.subLine}
          </p>
          {m.isLegacyJwt ? (
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.78rem", color: "rgba(232,234,237,0.45)" }}>
              Your API is returning JWT claims only for <code>/me</code>. Deploy the latest API to show email and agency name.
            </p>
          ) : null}
        </div>

        <nav aria-label="Admin sections">
          <p style={{ margin: "0 0 0.5rem", fontSize: "0.8125rem", fontWeight: 600, color: "var(--admin-muted)" }}>
            Go to
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            <Link href="/listings/" className="admin-btn admin-btn-primary" style={{ minHeight: "2.5rem" }}>
              Listings
            </Link>
            <Link href="/crm/" className="admin-btn admin-btn-ghost" style={{ minHeight: "2.5rem" }}>
              CRM
            </Link>
          </div>
        </nav>

        <button className="admin-btn admin-btn-ghost" onClick={signOut} type="button">
          Sign out
        </button>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <p className="admin-lead" style={{ color: "#ffb4b4" }}>
        {state.message}
      </p>
    );
  }

  return (
    <div className="admin-actions">
      <Link href="/login/" className="admin-btn admin-btn-primary">
        Sign in
      </Link>
    </div>
  );
}
