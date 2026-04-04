"use client";

import Link from "next/link";
import { ForgotPasswordClient } from "./ForgotPasswordClient";

export default function ForgotPasswordPage() {
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
          <h1>Reset your password</h1>
          <p className="admin-lead" style={{ marginLeft: "auto", marginRight: "auto" }}>
            Enter your account email and we’ll send you a reset link.
          </p>
          <div style={{ textAlign: "left" }}>
            <ForgotPasswordClient />
          </div>
          <p className="admin-foot" style={{ marginTop: 10 }}>
            Remembered it? <Link className="admin-link" href="/login/">Back to sign in</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}

