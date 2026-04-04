"use client";

import { useTranslation } from "react-i18next";
import { useI18nSettings } from "./I18nProvider";
import type { AppLanguage } from "../../lib/i18n";
import { LANGUAGE_LABEL_I18N_KEYS, SUPPORTED_LANGUAGES } from "../../lib/supported-languages";

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const { language, setLanguage } = useI18nSettings();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: "0.8rem", color: "var(--admin-muted)", fontWeight: 650 }}>{t("language.label")}</span>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as AppLanguage)}
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
        {SUPPORTED_LANGUAGES.map((code) => (
          <option key={code} value={code}>
            {t(`language.${LANGUAGE_LABEL_I18N_KEYS[code]}`)}
          </option>
        ))}
      </select>
    </div>
  );
}

