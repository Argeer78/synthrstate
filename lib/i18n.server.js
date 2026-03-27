import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, normalizeLocale, parseAcceptLanguage } from "./i18n";

export async function getRequestLocale() {
  const store = await cookies();
  const cookieLocale = normalizeLocale(store.get(LOCALE_COOKIE)?.value);
  if (cookieLocale && cookieLocale !== DEFAULT_LOCALE) return cookieLocale;
  const h = await headers();
  return parseAcceptLanguage(h.get("accept-language"));
}
