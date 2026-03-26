"use client";

import { useTheme } from "./ThemeProvider";
import type { ThemeMode } from "../../lib/theme";
import { useTranslation } from "react-i18next";

function label(mode: ThemeMode) {
  if (mode === "light") return "Light";
  if (mode === "dark") return "Dark";
  return "System";
}

export function ThemeSwitcher() {
  const { t } = useTranslation();
  const { mode, resolved, setMode } = useTheme();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: "0.8rem", color: "var(--admin-muted)", fontWeight: 650 }}>{t("theme.label")}</span>
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value as ThemeMode)}
        aria-label={`Theme: ${label(mode)} (${resolved})`}
        style={{
          height: "2.25rem",
          borderRadius: "0.6rem",
          border: "1px solid var(--admin-border)",
          background: "var(--admin-input-bg)",
          color: "var(--admin-text)",
          padding: "0 0.6rem",
          fontWeight: 650,
        }}
      >
        <option value="system">{t("theme.system")}</option>
        <option value="dark">{t("theme.dark")}</option>
        <option value="light">{t("theme.light")}</option>
      </select>
    </div>
  );
}

