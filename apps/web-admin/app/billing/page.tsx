import { AdminShell } from "../AdminShell";
import { RequirePageAccess } from "../guard/RequirePageAccess";
import { BillingClient } from "./BillingClient";
import { Suspense } from "react";

export default function BillingPage() {
  return (
    <AdminShell title="Billing" subtitle="Agency subscription and plan management." backHref="/" backLabel="← Home">
      <RequirePageAccess allowedRoles={["OWNER", "MANAGER"]}>
        <Suspense fallback={<p className="admin-lead">Loading billing…</p>}>
          <BillingClient />
        </Suspense>
      </RequirePageAccess>
    </AdminShell>
  );
}

