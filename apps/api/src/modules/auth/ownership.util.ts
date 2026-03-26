import { UserRole } from "@prisma/client";
import { hasFullAgencyDataScope, isViewerRole } from "./rbac.constants";

export type AuthActor = {
  agencyId: string;
  membershipId: string;
  role: UserRole;
};

/**
 * Layer 2 (object scope): always start with agencyId.
 * Owner/Manager: no extra ownership filter (full agency).
 * Agent: created OR assigned (where applicable).
 * Viewer (STAFF): same read scope as Agent, but routes must forbid mutations.
 */
export function ownershipOrForAgentViewer(
  actor: AuthActor,
  options: { supportsAssigned: boolean },
): Record<string, unknown> {
  if (hasFullAgencyDataScope(actor.role)) {
    return {};
  }

  if (isViewerRole(actor.role) || actor.role === UserRole.AGENT) {
    const or: Array<Record<string, unknown>> = [{ createdByMembershipId: actor.membershipId }];
    if (options.supportsAssigned) {
      or.push({ assignedToMembershipId: actor.membershipId });
    }
    return { OR: or };
  }

  return {};
}

/** Notes / properties / media “own” = createdBy only (no assignment field). */
export function ownershipCreatedByOnly(actor: AuthActor): Record<string, unknown> {
  if (hasFullAgencyDataScope(actor.role)) return {};
  if (isViewerRole(actor.role) || actor.role === UserRole.AGENT) {
    return { createdByMembershipId: actor.membershipId };
  }
  return {};
}
