import Link from "next/link";

export default function AdminHomePage() {
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
          <h1>Welcome back</h1>
          <p className="admin-lead">
            Your workspace for listings, CRM, and multi-channel publishing —
            built for real estate agencies.
          </p>
          <ul className="admin-list">
            <li>Listings and catalog in one place</li>
            <li>Contacts, leads, and follow-ups</li>
            <li>Publish to the channels your team uses</li>
          </ul>
          <div className="admin-actions">
            <Link href="/login" className="admin-btn admin-btn-primary">
              Sign in
            </Link>
          </div>
          <p className="admin-foot">
            Secure access for your agency. Need an account? Contact your
            administrator.
          </p>
        </div>
      </main>
    </div>
  );
}
