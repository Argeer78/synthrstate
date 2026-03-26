"use client";

import { AdminShell } from "../AdminShell";
import { RequirePageAccess } from "../guard/RequirePageAccess";
import { ManualClient } from "./ManualClient";
import { useTranslation } from "react-i18next";

export default function ManualPage() {
  const { t } = useTranslation();
  return (
    <RequirePageAccess allowedRoles={["OWNER", "MANAGER", "AGENT", "STAFF"]}>
      <AdminShell title={t("manual.title")} subtitle={t("manual.subtitle")} backHref="/" backLabel={`← ${t("common.home")}`}>
        <ManualClient />
      </AdminShell>
    </RequirePageAccess>
  );
}

