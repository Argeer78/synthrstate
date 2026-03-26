import { AdminShell } from "./AdminShell";
import { DashboardClient } from "./DashboardClient";

export default function AdminHomePage() {
  return (
    <AdminShell
      title="Dashboard"
      subtitle={
        <>
          Today’s operational overview for your agency.
        </>
      }
    >
      <DashboardClient />
    </AdminShell>
  );
}
