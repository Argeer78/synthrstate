export const SUPPORTED_LANGUAGE_CODES = [
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
] as const;

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGE_CODES)[number];

export function normalizeSupportedLanguage(lang?: string | null): SupportedLanguageCode {
  const v = (lang ?? "").trim().toLowerCase();
  return (SUPPORTED_LANGUAGE_CODES as readonly string[]).includes(v) ? (v as SupportedLanguageCode) : "en";
}

export function isSupportedLanguageCode(code: string): code is SupportedLanguageCode {
  const v = code.trim().toLowerCase();
  return (SUPPORTED_LANGUAGE_CODES as readonly string[]).includes(v);
}

