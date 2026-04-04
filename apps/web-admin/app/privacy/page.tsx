"use client";

import Link from "next/link";

export default function PrivacyPage() {
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
          <h1 style={{ marginTop: 0 }}>Privacy Policy</h1>
          <p className="admin-lead">Add your Privacy Policy content here.</p>
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

