"use client";

import Link from "next/link";
import { LoginForm } from "./LoginForm";
import { useTranslation } from "react-i18next";

export default function LoginPage() {
  const { t } = useTranslation();
  return (
    <div className="admin-shell">
      <header className="admin-top">
        <div className="admin-mark">
          <span className="admin-mark-icon" aria-hidden>
            S
          </span>
          <span>Synthr Admin</span>
        </div>
      </header>

      <main className="admin-main">
        <div className="admin-card" style={{ margin: "0 auto", textAlign: "center" }}>
          <h1>{t("login.title")}</h1>
          <p className="admin-lead">
            {t("login.subtitle")}
          </p>
          <div style={{ textAlign: "left" }}>
            <LoginForm />
          </div>
          <p className="admin-foot" style={{ marginTop: 10 }}>
            Don&apos;t have a workspace? <Link className="admin-link" href="/signup/">Create one</Link>.
          </p>
          <p className="admin-foot">
            {t("login.support")}
          </p>
          <p className="admin-foot" style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link className="admin-link" href="/terms/">
              Terms
            </Link>
            <span aria-hidden style={{ opacity: 0.5 }}>
              ·
            </span>
            <Link className="admin-link" href="/privacy/">
              Privacy Policy
            </Link>
            <span aria-hidden style={{ opacity: 0.5 }}>
              ·
            </span>
            <Link className="admin-link" href="/cookies/">
              Cookies
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
