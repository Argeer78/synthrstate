import { AdminShell } from "../AdminShell";
import { RequirePageAccess } from "../guard/RequirePageAccess";
import { UsersClient } from "./UsersClient";

export default function UsersPage() {
  return (
    <AdminShell title="User management" subtitle="Team members and roles (UI-only placeholder)." backHref="/" backLabel="← Home">
      <RequirePageAccess allowedRoles={["OWNER", "MANAGER"]}>
        <UsersClient />
      </RequirePageAccess>
    </AdminShell>
  );
}

