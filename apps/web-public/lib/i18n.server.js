import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, normalizeLocale, parseAcceptLanguage, SUPPORTED_LOCALES } from "./i18n";

export async function getRequestLocale() {
  const store = await cookies();
  const raw = store.get(LOCALE_COOKIE)?.value;
  if (raw != null && String(raw).trim() !== "") {
    const cookieLocale = normalizeLocale(raw);
    if (SUPPORTED_LOCALES.includes(cookieLocale)) return cookieLocale;
  }
  const h = await headers();
  return parseAcceptLanguage(h.get("accept-language"));
}
