import { UserRole } from "@prisma/client";

/**
 * RBAC for Synthr (MVP).
 *
 * Prisma enum uses `STAFF` — treat it as **Viewer** (read-only) everywhere in app + API.
 * Prefer renaming `STAFF` → `VIEWER` in a future migration when you can coordinate DB + deploy.
 */

/** Roles that behave as read-only viewers (see permission matrix). */
export const VIEWER_ROLES: ReadonlySet<UserRole> = new Set([UserRole.STAFF]);

export function isViewerRole(role: UserRole): boolean {
  return VIEWER_ROLES.has(role);
}

export function isOwner(role: UserRole): boolean {
  return role === UserRole.OWNER;
}

export function isManager(role: UserRole): boolean {
  return role === UserRole.MANAGER;
}

export function isAgent(role: UserRole): boolean {
  return role === UserRole.AGENT;
}

/** Owner + Manager: full agency scope in queries (still always filter by agencyId). */
export function hasFullAgencyDataScope(role: UserRole): boolean {
  return role === UserRole.OWNER || role === UserRole.MANAGER;
}

/** Publish / unpublish listings (route-level @Roles). */
export function rolesAllowedPublishListing(): UserRole[] {
  return [UserRole.OWNER, UserRole.MANAGER];
}

/** Default: only Owner may hard-delete listings (route-level @Roles). */
export function rolesAllowedDeleteListing(): UserRole[] {
  return [UserRole.OWNER];
}

/** Billing write (Stripe subscription changes). */
export function rolesAllowedBillingWrite(): UserRole[] {
  return [UserRole.OWNER];
}

/** Billing read (invoices, usage). */
export function rolesAllowedBillingRead(): UserRole[] {
  return [UserRole.OWNER, UserRole.MANAGER];
}

/** User/team management (invite, deactivate, change roles except Owner promotion rules in service). */
export function rolesAllowedTeamManage(): UserRole[] {
  return [UserRole.OWNER, UserRole.MANAGER];
}

/** AI: generate + apply without draft restriction. */
export function rolesAllowedAiFull(): UserRole[] {
  return [UserRole.OWNER, UserRole.MANAGER];
}

/** AI: Agent may generate; apply only to draft-level content (enforce in service). */
export function rolesAllowedAiGenerate(): UserRole[] {
  return [UserRole.OWNER, UserRole.MANAGER, UserRole.AGENT];
}

/** Route-level: reads (GET) for authenticated tenant members. */
export const ROLES_READ: UserRole[] = [
  UserRole.OWNER,
  UserRole.MANAGER,
  UserRole.AGENT,
  UserRole.STAFF,
];

/** Route-level: creates/updates (POST/PATCH) excluding viewers. */
export const ROLES_MUTATE: UserRole[] = [UserRole.OWNER, UserRole.MANAGER, UserRole.AGENT];
