/** /me response: enriched profile (new API) or legacy JWT payload in `user` (old API). */
export type MeView = {
  emailLine: string;
  subLine: string;
  isLegacyJwt: boolean;
};

type JwtLike = {
  sub?: string;
  agencyId?: string;
  membershipId?: string;
  role?: string;
};

export function normalizeMe(raw: unknown): MeView {
  const r = raw as {
    user?: JwtLike & { email?: string; fullName?: string | null; id?: string } | null;
    agency?: { name?: string; slug?: string } | null;
    membership?: { role?: string } | null;
  };

  const u = r.user;
  if (!u) {
    return {
      emailLine: "Session active",
      subLine: "— · —",
      isLegacyJwt: false,
    };
  }

  if (typeof u.email === "string" && u.email.length > 0) {
    const name = typeof u.fullName === "string" && u.fullName.trim() ? ` (${u.fullName.trim()})` : "";
    const agency = r.agency?.name ?? r.agency?.slug ?? "—";
    const role = r.membership?.role ?? "—";
    return {
      emailLine: `${u.email}${name}`,
      subLine: `${agency} · ${role}`,
      isLegacyJwt: false,
    };
  }

  if (u.sub && u.role) {
    const short = u.sub.length > 10 ? `${u.sub.slice(0, 6)}…` : u.sub;
    const agency = u.agencyId ? `${u.agencyId.slice(0, 8)}…` : "—";
    return {
      emailLine: `Signed in (user ${short})`,
      subLine: `${agency} · ${u.role}`,
      isLegacyJwt: true,
    };
  }

  return {
    emailLine: "Session active",
    subLine: "— · —",
    isLegacyJwt: false,
  };
}
