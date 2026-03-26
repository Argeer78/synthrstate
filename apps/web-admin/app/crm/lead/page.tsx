import { AdminShell } from "../../AdminShell";
import { LeadWorkspaceClient } from "./LeadWorkspaceClient";
import { Suspense } from "react";

export default function LeadWorkspacePage() {
  return (
    <AdminShell title="Lead workspace" subtitle="Work a lead: status, notes, tasks, and inquiry context." backHref="/crm/" backLabel="← CRM">
      <Suspense fallback={<p className="admin-lead">Loading lead…</p>}>
        <LeadWorkspaceClient />
      </Suspense>
    </AdminShell>
  );
}

