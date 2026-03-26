"use client";

import Link from "next/link";
import { AdminSidebar } from "./AdminSidebar";
import { ThemeSwitcher } from "./components/ThemeSwitcher";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { NotificationBell } from "./components/NotificationBell";
import { useEffect, useState } from "react";
import { OnboardingWizard } from "./components/OnboardingWizard";
import { HelpAssistant } from "./components/HelpAssistant";
import { useTranslation } from "react-i18next";

export function AdminShell(props: {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  const { t } = useTranslation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileNavOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function onLogout() {
    try {
      setLoggingOut(true);
      const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
      if (apiBase) {
        await fetch(`${apiBase}/auth/logout`, {
          method: "POST",
          credentials: "include",
          headers: { Accept: "application/json" },
        });
      }
    } finally {
      window.location.href = "/login/";
    }
  }

  return (
    <div className="admin-shell">
      <header className="admin-top">
        <button
          type="button"
          className="admin-btn admin-btn-ghost admin-mobile-nav-btn"
          onClick={() => setMobileNavOpen(true)}
          aria-label={t("shell.openNavigation")}
          style={{ minHeight: "2.25rem", padding: "0 0.75rem" }}
        >
          ☰
        </button>
        <div className="admin-mark">
          <span className="admin-mark-icon" aria-hidden>
            S
          </span>
          <span>Synthr Admin</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <NotificationBell />
          <ThemeSwitcher />
          <LanguageSwitcher />
          <HelpAssistant />
          <button
            type="button"
            className="admin-btn admin-btn-ghost"
            style={{ minHeight: "2.25rem", padding: "0 0.75rem" }}
            onClick={onLogout}
            disabled={loggingOut}
          >
            {loggingOut ? t("common.signingOut") : t("common.signOut")}
          </button>
        </div>
      </header>

      {mobileNavOpen ? (
        <div className="admin-mobile-nav-overlay" role="dialog" aria-modal="true" aria-label={t("shell.menu")}>
          <button className="admin-mobile-nav-backdrop" type="button" onClick={() => setMobileNavOpen(false)} aria-label={t("shell.closeNavigation")} />
          <div className="admin-mobile-nav-drawer">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 800 }}>{t("shell.menu")}</div>
              <button className="admin-btn admin-btn-ghost" style={{ minHeight: "2.25rem", padding: "0 0.75rem" }} onClick={() => setMobileNavOpen(false)}>
                {t("common.close")}
              </button>
            </div>
            <AdminSidebar variant="mobile" onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </div>
      ) : null}

      <main className="admin-main">
        <div className="admin-container">
          <div className="admin-layout">
            <div className="admin-sidebar-desktop">
              <AdminSidebar variant="desktop" />
            </div>
            <div className="admin-page admin-card" style={{ maxWidth: "none" }}>
              <OnboardingWizard autoOpen />
          {props.backHref ? (
            <Link href={props.backHref} className="admin-back">
              {props.backLabel ?? `← ${t("common.back")}`}
            </Link>
          ) : null}
          <h1>{props.title}</h1>
          {props.subtitle ? (
            <p className="admin-lead" style={{ marginBottom: "1.25rem" }}>
              {props.subtitle}
            </p>
          ) : null}
          {props.children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

