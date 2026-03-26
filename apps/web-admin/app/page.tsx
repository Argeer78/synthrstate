"use client";

import { AdminShell } from "./AdminShell";
import { DashboardClient } from "./DashboardClient";
import { useTranslation } from "react-i18next";

export default function AdminHomePage() {
  const { t } = useTranslation();
  return (
    <AdminShell
      title={t("dashboard.title")}
      subtitle={
        <>
          {t("dashboard.subtitle")}
        </>
      }
    >
      <DashboardClient />
    </AdminShell>
  );
}
