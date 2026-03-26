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
        <div className="admin-card">
          <Link href="/" className="admin-back">
            ← {t("login.back")}
          </Link>
          <h1>{t("login.title")}</h1>
          <p className="admin-lead">
            {t("login.subtitle")}
          </p>
          <LoginForm />
          <p className="admin-foot">
            {t("login.support")}
          </p>
        </div>
      </main>
    </div>
  );
}
