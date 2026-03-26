"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { I18nextProvider } from "react-i18next";
import i18n, { applyLanguage, DEFAULT_LANGUAGE, getInitialLanguage, type AppLanguage } from "../../lib/i18n";

type I18nContextValue = {
  language: AppLanguage;
  setLanguage: (next: AppLanguage) => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider(props: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(DEFAULT_LANGUAGE);

  useEffect(() => {
    const initial = getInitialLanguage();
    setLanguageState(initial);
    applyLanguage(initial);
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage: (next) => {
        setLanguageState(next);
        applyLanguage(next);
      },
    }),
    [language],
  );

  return (
    <I18nextProvider i18n={i18n}>
      <I18nContext.Provider value={value}>{props.children}</I18nContext.Provider>
    </I18nextProvider>
  );
}

export function useI18nSettings() {
  const v = useContext(I18nContext);
  if (!v) throw new Error("useI18nSettings must be used within I18nProvider");
  return v;
}

