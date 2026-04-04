/** Single source of truth for admin UI languages (must match each folder under locales/). */
export const SUPPORTED_LANGUAGES = [
  "en",
  "cs",
  "da",
  "de",
  "el",
  "es",
  "fi",
  "fr",
  "hr",
  "hu",
  "it",
  "nl",
  "pl",
  "pt",
  "ro",
  "sv",
  "tr",
] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** `common.json` keys under `language.*` for each locale code (English file must define all). */
export const LANGUAGE_LABEL_I18N_KEYS: Record<AppLanguage, string> = {
  en: "english",
  cs: "czech",
  da: "danish",
  de: "german",
  el: "greek",
  es: "spanish",
  fi: "finnish",
  fr: "french",
  hr: "croatian",
  hu: "hungarian",
  it: "italian",
  nl: "dutch",
  pl: "polish",
  pt: "portuguese",
  ro: "romanian",
  sv: "swedish",
  tr: "turkish",
};

const LANG_SET = new Set<string>(SUPPORTED_LANGUAGES);

export function isAppLanguage(value: string | null | undefined): value is AppLanguage {
  return value != null && LANG_SET.has(value);
}
