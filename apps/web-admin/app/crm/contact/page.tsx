import { Suspense } from "react";
import { AdminShell } from "../../AdminShell";
import { ContactWorkspaceClient } from "./ContactWorkspaceClient";

export default function ContactWorkspacePage() {
  return (
    <AdminShell title="Contact workspace" subtitle="Contact details, leads, notes, tasks, inquiries, and activity." backHref="/crm/" backLabel="← CRM">
      <Suspense fallback={<p className="admin-lead">Loading contact…</p>}>
        <ContactWorkspaceClient />
      </Suspense>
    </AdminShell>
  );
}

