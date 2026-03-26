import { ListingsClient } from "./ListingsClient";
import { AdminShell } from "../AdminShell";
import { Suspense } from "react";

export default function AdminListingsPage() {
  return (
    <AdminShell
      title="Listings"
      subtitle={
        <>
          Your agency listings from the Synthr API (<code>GET /catalog/listings</code>).
        </>
      }
      backHref="/"
      backLabel="← Home"
    >
      <Suspense fallback={<p className="admin-lead">Loading listings…</p>}>
        <ListingsClient />
      </Suspense>
    </AdminShell>
  );
}
