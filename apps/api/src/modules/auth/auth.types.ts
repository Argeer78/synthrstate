import type { UserRole } from "@prisma/client";

export type JwtClaims = {
  sub: string; // userId
  agencyId: string;
  membershipId: string;
  role: UserRole;
};

