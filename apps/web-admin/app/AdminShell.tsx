import Link from "next/link";
import { AdminSidebar } from "./AdminSidebar";

export function AdminShell(props: {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
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

      <main className="admin-main" style={{ display: "grid", gridTemplateColumns: "16rem 1fr", gap: "1rem", width: "100%", maxWidth: "74rem" }}>
        <AdminSidebar />
        <div className="admin-card" style={{ maxWidth: "none" }}>
          {props.backHref ? (
            <Link href={props.backHref} className="admin-back">
              {props.backLabel ?? "← Back"}
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
      </main>
    </div>
  );
}

