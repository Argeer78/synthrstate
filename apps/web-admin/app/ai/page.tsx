import { AdminShell } from "../AdminShell";
import { RequirePageAccess } from "../guard/RequirePageAccess";

export default function AiPage() {
  return (
    <AdminShell title="AI" subtitle="Generate listing descriptions and lead summaries." backHref="/" backLabel="← Home">
      <RequirePageAccess allowedRoles={["OWNER", "MANAGER", "AGENT"]}>
        <p className="admin-lead">
          AI tools are not available to Viewer (STAFF) users.
        </p>
      </RequirePageAccess>
    </AdminShell>
  );
}

