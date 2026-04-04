import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import csCommon from "../locales/cs/common.json";
import daCommon from "../locales/da/common.json";
import deCommon from "../locales/de/common.json";
import elCommon from "../locales/el/common.json";
import enCommon from "../locales/en/common.json";
import esCommon from "../locales/es/common.json";
import fiCommon from "../locales/fi/common.json";
import frCommon from "../locales/fr/common.json";
import hrCommon from "../locales/hr/common.json";
import huCommon from "../locales/hu/common.json";
import itCommon from "../locales/it/common.json";
import nlCommon from "../locales/nl/common.json";
import plCommon from "../locales/pl/common.json";
import ptCommon from "../locales/pt/common.json";
import roCommon from "../locales/ro/common.json";
import svCommon from "../locales/sv/common.json";
import trCommon from "../locales/tr/common.json";
import { type AppLanguage, isAppLanguage } from "./supported-languages";

export { type AppLanguage, SUPPORTED_LANGUAGES } from "./supported-languages";

export const I18N_STORAGE_KEY = "synthr_admin_lang";
export const DEFAULT_LANGUAGE: AppLanguage = "en";

function normalizeLanguage(value: string | null | undefined): AppLanguage {
  const v = String(value ?? "")
    .toLowerCase()
    .split("-")[0];
  if (isAppLanguage(v)) return v;
  return DEFAULT_LANGUAGE;
}

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { common: enCommon },
        cs: { common: csCommon },
        da: { common: daCommon },
        de: { common: deCommon },
        el: { common: elCommon },
        es: { common: esCommon },
        fi: { common: fiCommon },
        fr: { common: frCommon },
        hr: { common: hrCommon },
        hu: { common: huCommon },
        it: { common: itCommon },
        nl: { common: nlCommon },
        pl: { common: plCommon },
        pt: { common: ptCommon },
        ro: { common: roCommon },
        sv: { common: svCommon },
        tr: { common: trCommon },
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
