import { Suspense } from "react";
import { AdminShell } from "../../AdminShell";
import { ListingWorkspaceClient } from "./ListingWorkspaceClient";

export default function ListingWorkspacePage() {
  return (
    <AdminShell title="Listing workspace" subtitle="Manage listing details, media, AI, and publishing." backHref="/listings/" backLabel="← Listings">
      <Suspense fallback={<p className="admin-lead">Loading listing…</p>}>
        <ListingWorkspaceClient />
      </Suspense>
    </AdminShell>
  );
}

