"use client";

import { AdminShell } from "../AdminShell";
import { AccountClient } from "./AccountClient";

export default function AccountPage() {
  return (
    <AdminShell title="Account" subtitle="Manage your profile and password.">
      <AccountClient />
    </AdminShell>
  );
}

