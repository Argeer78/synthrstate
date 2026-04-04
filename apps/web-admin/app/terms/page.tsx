"use client";

import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="admin-shell">
      <header className="admin-top">
        <div className="admin-mark">
          <span className="admin-mark-icon" aria-hidden>
            S
          </span>
          <span>Synthr</span>
        </div>
      </header>

      <main className="admin-main">
        <div className="admin-card" style={{ margin: "0 auto" }}>
          <h1 style={{ marginTop: 0 }}>Terms of Service</h1>
          <p className="admin-lead">Add your Terms of Service content here.</p>
          <p className="admin-foot">
            <Link className="admin-link" href="/login/">
              Back to sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

