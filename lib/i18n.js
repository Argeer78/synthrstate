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
