import Link from "next/link";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
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
            ← Back
          </Link>
          <h1>Sign in</h1>
          <p className="admin-lead">
            Enter your work email and password to open your agency workspace.
          </p>
          <LoginForm />
          <p className="admin-foot">
            Trouble signing in? Ask your agency owner or reach out to Synthr
            support.
          </p>
        </div>
      </main>
    </div>
  );
}
