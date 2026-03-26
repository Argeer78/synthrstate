"use client";

import Link from "next/link";
import { useMe } from "../lib/use-me";
import { canAccessAi, canAccessBilling, canManageUsers } from "../utils/permissions";
import { normalizeMe } from "../lib/normalize-me";
import { useTranslation } from "react-i18next";

export function AdminSidebar(props: { onNavigate?: () => void; variant?: "desktop" | "mobile" } = {}) {
  const { t } = useTranslation();
  const { state, role } = useMe();
  const showIntegrations = role === "OWNER" || role === "MANAGER";

  return (
    <aside
      className="admin-card"
      style={{
        padding: "1rem",
        maxWidth: "none",
        height: "fit-content",
        position: props.variant === "mobile" ? "relative" : "sticky",
        top: props.variant === "mobile" ? undefined : "1rem",
      }}
    >
      <div style={{ marginBottom: "0.75rem" }}>
        <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--admin-muted)", fontWeight: 600 }}>{t("sidebar.workspace")}</p>
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
            {state.status === "loading" ? t("sidebar.checkingSession") : t("sidebar.notSignedIn")}
          </p>
        )}
      </div>

      <nav aria-label="Admin navigation" style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <Link className="admin-btn admin-btn-ghost" href="/" onClick={props.onNavigate}>
          {t("common.home")}
        </Link>
        <Link className="admin-btn admin-btn-ghost" href="/listings/" onClick={props.onNavigate}>
          {t("common.listings")}
        </Link>
        <Link className="admin-btn admin-btn-ghost" href="/crm/" onClick={props.onNavigate}>
          {t("common.crm")}
        </Link>
        <Link className="admin-btn admin-btn-ghost" href="/manual/" onClick={props.onNavigate}>
          {t("common.userManual")}
        </Link>
        <Link className="admin-btn admin-btn-ghost" href="/feedback/" onClick={props.onNavigate}>
          {t("common.feedback")}
        </Link>

        {showIntegrations ? (
          <Link className="admin-btn admin-btn-ghost" href="/integrations/" onClick={props.onNavigate}>
            {t("common.apiFeeds")}
          </Link>
        ) : null}

        {canAccessAi(role) ? (
          <Link className="admin-btn admin-btn-ghost" href="/ai/" onClick={props.onNavigate}>
            {t("common.ai")}
          </Link>
        ) : null}

        {canManageUsers(role) ? (
          <Link className="admin-btn admin-btn-ghost" href="/users/" onClick={props.onNavigate}>
            {t("common.userManagement")}
          </Link>
        ) : null}

        {canAccessBilling(role) ? (
          <Link className="admin-btn admin-btn-ghost" href="/billing/" onClick={props.onNavigate}>
            {t("common.billing")}
          </Link>
        ) : null}
      </nav>
    </aside>
  );
}

