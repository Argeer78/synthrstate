import { Suspense } from "react";
import { AdminShell } from "../AdminShell";
import { RequirePageAccess } from "../guard/RequirePageAccess";
import { IntegrationsClient } from "./IntegrationsClient";

export default function IntegrationsPage() {
  return (
    <RequirePageAccess allowedRoles={["OWNER", "MANAGER"]}>
      <AdminShell title="API & Feeds" subtitle="Developer & integration documentation for your agency." backHref="/" backLabel="← Home">
        <Suspense fallback={<p className="admin-lead">Loading…</p>}>
          <IntegrationsClient />
        </Suspense>
      </AdminShell>
    </RequirePageAccess>
  );
}

