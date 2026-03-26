import type { JwtClaims } from "../modules/auth/auth.types";
import type { TenantContext } from "./tenant.types";

export function getTenantFromRequestUser(user: unknown): TenantContext {
  const u = user as JwtClaims | undefined;
  if (!u?.agencyId || !u?.membershipId) {
    throw new Error("Missing tenant context on request user");
  }
  return { agencyId: u.agencyId, membershipId: u.membershipId };
}

