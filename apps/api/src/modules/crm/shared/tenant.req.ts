import type { Request } from "express";
import type { JwtClaims } from "../../auth/auth.types";

export function getAuthContext(req: Request) {
  const user = req.user as JwtClaims | undefined;
  if (!user?.agencyId || !user?.membershipId) {
    throw new Error("Missing auth context");
  }
  return {
    userId: user.sub,
    agencyId: user.agencyId,
    membershipId: user.membershipId,
    role: user.role,
  };
}

