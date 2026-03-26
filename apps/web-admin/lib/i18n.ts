import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import enCommon from "../locales/en/common.json";
import esCommon from "../locales/es/common.json";
import frCommon from "../locales/fr/common.json";
import deCommon from "../locales/de/common.json";
import itCommon from "../locales/it/common.json";
import ptCommon from "../locales/pt/common.json";
import elCommon from "../locales/el/common.json";

export const I18N_STORAGE_KEY = "synthr_admin_lang";
export const SUPPORTED_LANGUAGES = ["en", "es", "fr", "de", "it", "pt", "el"] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: AppLanguage = "en";

function normalizeLanguage(value: string | null | undefined): AppLanguage {
  if (value === "fr") return "fr";
  if (value === "de") return "de";
  if (value === "it") return "it";
  if (value === "pt") return "pt";
  if (value === "el") return "el";
  if (value === "es") return "es";
  return "en";
}

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { common: enCommon },
        es: { common: esCommon },
        fr: { common: frCommon },
        de: { common: deCommon },
        it: { common: itCommon },
        pt: { common: ptCommon },
        el: { common: elCommon },
      },
      fallbackLng: DEFAULT_LANGUAGE,
      defaultNS: "common",
      ns: ["common"],
      interpolation: { escapeValue: false },
      detection: {
        order: ["localStorage", "navigator"],
        caches: ["localStorage"],
        lookupLocalStorage: I18N_STORAGE_KEY,
      },
      lng: DEFAULT_LANGUAGE,
      react: { useSuspense: false },
      returnNull: false,
    });
}

export function getInitialLanguage(): AppLanguage {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  const stored = window.localStorage.getItem(I18N_STORAGE_KEY);
  if (stored) return normalizeLanguage(stored);
  return normalizeLanguage(window.navigator.language?.slice(0, 2));
}

export function applyLanguage(lang: AppLanguage) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = lang;
  }
  if (typeof window !== "undefined") {
    window.localStorage.setItem(I18N_STORAGE_KEY, lang);
  }
  void i18n.changeLanguage(lang);
}

export default i18n;

