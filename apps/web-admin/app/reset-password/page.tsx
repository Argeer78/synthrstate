"use client";

import Link from "next/link";
import { ResetPasswordClient } from "./ResetPasswordClient";
import { Suspense } from "react";

export default function ResetPasswordPage() {
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
          <h1>Set a new password</h1>
          <p className="admin-lead" style={{ marginLeft: "auto", marginRight: "auto" }}>
            Choose a new password for your account.
          </p>
          <div style={{ textAlign: "left" }}>
            <Suspense fallback={<p className="admin-lead">Loading…</p>}>
              <ResetPasswordClient />
            </Suspense>
          </div>
          <p className="admin-foot" style={{ marginTop: 10 }}>
            <Link className="admin-link" href="/login/">
              Back to sign in
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}

