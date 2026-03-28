import { NextResponse } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, SUPPORTED_LOCALES, normalizeLocale } from "./lib/i18n";

export function proxy(request) {
  const response = NextResponse.next();
  const existing = request.cookies.get(LOCALE_COOKIE)?.value;
  if (existing) return response;

  const accept = request.headers.get("accept-language") || "";
  const first = accept.split(",")[0] || DEFAULT_LOCALE;
  const locale = normalizeLocale(first);
  const finalLocale = SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
  response.cookies.set(LOCALE_COOKIE, finalLocale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  return response;
}

// Exclude metadata and static assets so /sitemap.xml and /robots.txt reach Next (middleware on them can 404).
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|favicon.svg|sitemap.xml|robots.txt).*)"],
};
