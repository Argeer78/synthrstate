import { Prisma, UserRole } from "@prisma/client";
import { hasFullAgencyDataScope, isViewerRole } from "./rbac.constants";
import type { AuthActor } from "./ownership.util";

export type ActorScope = Pick<AuthActor, "role" | "membershipId">;

export function contactScopeWhere(actor: ActorScope): Prisma.ContactWhereInput {
  if (hasFullAgencyDataScope(actor.role)) return {};
  if (isViewerRole(actor.role) || actor.role === UserRole.AGENT) {
    return { createdByMembershipId: actor.membershipId };
  }
  return {};
}

export function leadScopeWhere(actor: ActorScope): Prisma.LeadWhereInput {
  if (hasFullAgencyDataScope(actor.role)) return {};
  if (isViewerRole(actor.role) || actor.role === UserRole.AGENT) {
    return {
      OR: [
        { createdByMembershipId: actor.membershipId },
        { assignedToMembershipId: actor.membershipId },
      ],
    };
  }
  return {};
}

export function taskScopeWhere(actor: ActorScope): Prisma.TaskWhereInput {
  if (hasFullAgencyDataScope(actor.role)) return {};
  if (isViewerRole(actor.role) || actor.role === UserRole.AGENT) {
    return {
      OR: [
        { createdByMembershipId: actor.membershipId },
        { assignedToMembershipId: actor.membershipId },
      ],
    };
  }
  return {};
}

export function noteScopeWhere(actor: ActorScope): Prisma.NoteWhereInput {
  if (hasFullAgencyDataScope(actor.role)) return {};
  if (isViewerRole(actor.role) || actor.role === UserRole.AGENT) {
    return { createdByMembershipId: actor.membershipId };
  }
  return {};
}

export function propertyScopeWhere(actor: ActorScope): Prisma.PropertyWhereInput {
  if (hasFullAgencyDataScope(actor.role)) return {};
  if (isViewerRole(actor.role) || actor.role === UserRole.AGENT) {
    return { createdByMembershipId: actor.membershipId };
  }
  return {};
}

export function listingScopeWhere(actor: ActorScope): Prisma.ListingWhereInput {
  if (hasFullAgencyDataScope(actor.role)) return {};
  if (isViewerRole(actor.role) || actor.role === UserRole.AGENT) {
    return { createdByMembershipId: actor.membershipId };
  }
  return {};
}

/** Activity feed: team-wide for Owner/Manager; otherwise events tied to visible CRM objects or self as actor. */
export function activityScopeWhere(actor: ActorScope): Prisma.ActivityEventWhereInput {
  if (hasFullAgencyDataScope(actor.role)) return {};
  if (isViewerRole(actor.role) || actor.role === UserRole.AGENT) {
    return {
      OR: [
        { actorMembershipId: actor.membershipId },
        { contact: { createdByMembershipId: actor.membershipId } },
        {
          lead: {
            OR: [
              { createdByMembershipId: actor.membershipId },
              { assignedToMembershipId: actor.membershipId },
            ],
          },
        },
        {
          task: {
            OR: [
              { createdByMembershipId: actor.membershipId },
              { assignedToMembershipId: actor.membershipId },
            ],
          },
        },
        { note: { createdByMembershipId: actor.membershipId } },
      ],
    };
  }
  return {};
}

export function inquiryScopeWhere(actor: ActorScope): Prisma.InquiryWhereInput {
  if (hasFullAgencyDataScope(actor.role)) return {};
  if (isViewerRole(actor.role) || actor.role === UserRole.AGENT) {
    // Inquiries are scoped via the listing they belong to.
    return {
      listing: {
        is: { createdByMembershipId: actor.membershipId },
      },
    };
  }
  return {};
}
