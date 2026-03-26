import type { UserRole } from "../utils/permissions";

export type MeResponse = {
  user?: { email?: string; fullName?: string | null } | null;
  agency?: { name?: string; slug?: string } | null;
  membership?: { role?: UserRole | string } | null;
  // legacy fallback (older API): JWT claims in user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [k: string]: any;
};

export function getRoleFromMe(raw: unknown): UserRole | null {
  const r = raw as MeResponse;
  const role = r?.membership?.role;
  if (role === "OWNER" || role === "MANAGER" || role === "AGENT" || role === "STAFF") return role;

  const legacyRole = (r as any)?.user?.role;
  if (legacyRole === "OWNER" || legacyRole === "MANAGER" || legacyRole === "AGENT" || legacyRole === "STAFF") return legacyRole;
  return null;
}

