"use client";

import { AdminShell } from "../AdminShell";
import { RequirePageAccess } from "../guard/RequirePageAccess";
import { FeedbackClient } from "./FeedbackClient";
import { useTranslation } from "react-i18next";

export default function FeedbackPage() {
  const { t } = useTranslation();
  return (
    <RequirePageAccess allowedRoles={["OWNER", "MANAGER", "AGENT", "STAFF"]}>
      <AdminShell title={t("feedback.title")} subtitle={t("feedback.subtitle")} backHref="/" backLabel={`← ${t("common.home")}`}>
        <FeedbackClient />
      </AdminShell>
    </RequirePageAccess>
  );
}

