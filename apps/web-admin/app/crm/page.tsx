import { ContactsClient } from "./ContactsClient";
import { AdminShell } from "../AdminShell";
import { LeadsClient } from "./LeadsClient";
import { TasksClient } from "./TasksClient";
import { InquiriesClient } from "./InquiriesClient";
import { Suspense } from "react";

export default function AdminCrmPage() {
  return (
    <AdminShell
      title="CRM · Contacts"
      subtitle={
        <>
          Contacts from the Synthr API (<code>GET /crm/contacts</code>). Leads and tasks can follow the same pattern.
        </>
      }
      backHref="/"
      backLabel="← Home"
    >
      <Suspense fallback={<p className="admin-lead">Loading CRM…</p>}>
        <ContactsClient />
      </Suspense>
      <InquiriesClient />
      <Suspense fallback={<p className="admin-lead">Loading leads…</p>}>
        <LeadsClient />
      </Suspense>
      <TasksClient />
    </AdminShell>
  );
}
