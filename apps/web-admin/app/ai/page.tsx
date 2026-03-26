import { AdminShell } from "../AdminShell";
import { RequirePageAccess } from "../guard/RequirePageAccess";

export default function AiPage() {
  return (
    <AdminShell title="AI" subtitle="Generate listing descriptions and lead summaries." backHref="/" backLabel="← Home">
      <RequirePageAccess allowedRoles={["OWNER", "MANAGER", "AGENT"]}>
        <div className="admin-card" style={{ maxWidth: "none", padding: "1rem" }}>
          <p className="admin-lead" style={{ marginBottom: "0.5rem" }}>
            AI tools are enabled for your role. Use AI directly from:
          </p>
          <ul className="admin-list" style={{ marginBottom: 0 }}>
            <li>Listing workspace: generate and apply listing descriptions</li>
            <li>Lead workspace: generate lead summaries from lead context</li>
          </ul>
        </div>
      </RequirePageAccess>
    </AdminShell>
  );
}

