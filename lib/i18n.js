import { getMergedMessages } from "./messages/index.js";

export const SUPPORTED_LOCALES = [
  "en",
  "el",
  "de",
  "es",
  "fr",
  "it",
  "nl",
  "pt",
  "sv",
  "da",
  "fi",
  "pl",
  "cs",
  "hu",
  "ro",
  "hr",
  "tr",
];

export const DEFAULT_LOCALE = "en";
export const LOCALE_COOKIE = "synthr_locale";
/** Max-age (seconds) for locale preference cookie — keep in sync with `proxy.js` / `PublicLanguageSwitcher`. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Native labels for the public language switcher (ISO 639-1 codes). */
export const LOCALE_LABELS = {
  en: "English",
  el: "Ελληνικά",
  de: "Deutsch",
  es: "Español",
  fr: "Français",
  it: "Italiano",
  nl: "Nederlands",
  pt: "Português",
  sv: "Svenska",
  da: "Dansk",
  fi: "Suomi",
  pl: "Polski",
  cs: "Čeština",
  hu: "Magyar",
  ro: "Română",
  hr: "Hrvatski",
  tr: "Türkçe",
};

export function normalizeLocale(input) {
  if (!input) return DEFAULT_LOCALE;
  const value = String(input).trim().toLowerCase().replace("_", "-");
  if (SUPPORTED_LOCALES.includes(value)) return value;
  const base = value.split("-")[0];
  if (SUPPORTED_LOCALES.includes(base)) return base;
  return DEFAULT_LOCALE;
}

function parseAcceptLanguage(headerValue) {
  if (!headerValue) return DEFAULT_LOCALE;
  const first = String(headerValue).split(",")[0] || "";
  return normalizeLocale(first);
}
export { parseAcceptLanguage };

export function getMessages(locale) {
  const l = normalizeLocale(locale);
  return getMergedMessages(l);
}
