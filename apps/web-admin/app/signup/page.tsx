"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { SignupForm } from "./SignupForm";

export default function SignupPage() {
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
          <h1>Create workspace</h1>
          <p className="admin-lead" style={{ marginLeft: "auto", marginRight: "auto" }}>
            Create an agency workspace and an owner account.
          </p>
          <div style={{ textAlign: "left" }}>
            <SignupForm />
          </div>
          <p className="admin-foot">
            Already have a workspace? <Link className="admin-link" href="/login/">Sign in</Link>.
          </p>
          <p className="admin-foot" style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link className="admin-link" href="https://synthrstate.com/terms" target="_blank" rel="noreferrer">
              Terms
            </Link>
            <span aria-hidden style={{ opacity: 0.5 }}>
              ·
            </span>
            <Link className="admin-link" href="https://synthrstate.com/privacy" target="_blank" rel="noreferrer">
              Privacy Policy
            </Link>
            <span aria-hidden style={{ opacity: 0.5 }}>
              ·
            </span>
            <Link className="admin-link" href="https://synthrstate.com/cookies" target="_blank" rel="noreferrer">
              Cookies
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

