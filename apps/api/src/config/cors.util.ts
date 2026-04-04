/**
 * Allowed browser origins for credentialed API calls.
 * Development: empty → allow any origin (reflect).
 * Production: set CORS_ORIGINS and/or ADMIN_APP_URL (combined into one allow-list).
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

  const admin = process.env.ADMIN_APP_URL?.trim().replace(/\/$/, "") ?? "";
  const fromList = raw
    ? raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const merged = new Set<string>([...fromList, ...(admin ? [admin] : [])]);
  if (merged.size === 0) {
    throw new Error(
      "In production set CORS_ORIGINS (comma-separated) and/or ADMIN_APP_URL (e.g. https://app.synthrstate.com).",
    );
  }
  return [...merged];
}
