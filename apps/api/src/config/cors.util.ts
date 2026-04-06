/**
 * Allowed browser origins for credentialed API calls.
 * Development: empty → allow any origin (reflect).
 * Production: set CORS_ORIGINS and/or one of ADMIN_APP_URL/WEB_PUBLIC_URL/PUBLIC_SITE_URL.
 */
export function getCorsOriginDelegate():
  | boolean
  | string[]
  | ((origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => void) {
  const raw = process.env.CORS_ORIGINS?.trim();

  if (process.env.NODE_ENV !== "production") {
    if (!raw) return true;
    const list = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return list.length === 0 ? true : list;
  }

  const normalize = (value: string | undefined) => value?.trim().replace(/\/$/, "") ?? "";

  const admin = normalize(process.env.ADMIN_APP_URL);
  const webPublic = normalize(process.env.WEB_PUBLIC_URL);
  const publicSite = normalize(process.env.PUBLIC_SITE_URL);
  const fromList = raw
    ? raw
        .split(",")
        .map((s) => normalize(s))
        .filter(Boolean)
    : [];

  const merged = new Set<string>([
    ...fromList,
    ...(admin ? [admin] : []),
    ...(webPublic ? [webPublic] : []),
    ...(publicSite ? [publicSite] : []),
  ]);
  if (merged.size === 0) {
    throw new Error(
      "In production set CORS_ORIGINS (comma-separated) and/or ADMIN_APP_URL, WEB_PUBLIC_URL, or PUBLIC_SITE_URL (e.g. https://synthrstate.com).",
    );
  }
  return [...merged];
}
