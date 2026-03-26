export type UserRole = "OWNER" | "MANAGER" | "AGENT" | "STAFF";

export function isViewer(role: UserRole | null | undefined) {
  return role === "STAFF";
}

export function canCreate(role: UserRole | null | undefined) {
  return role === "OWNER" || role === "MANAGER" || role === "AGENT";
}

export function canEdit(role: UserRole | null | undefined) {
  return role === "OWNER" || role === "MANAGER" || role === "AGENT";
}

export function canDelete(role: UserRole | null | undefined) {
  return role === "OWNER";
}

export function canPublish(role: UserRole | null | undefined) {
  return role === "OWNER" || role === "MANAGER";
}

export function canManageUsers(role: UserRole | null | undefined) {
  return role === "OWNER" || role === "MANAGER";
}

// Decision: Billing is owner-only in UI (backend may allow manager read; keep simple).
export function canAccessBilling(role: UserRole | null | undefined) {
  return role === "OWNER" || role === "MANAGER";
}

export function canAccessAi(role: UserRole | null | undefined) {
  return role === "OWNER" || role === "MANAGER" || role === "AGENT";
}

export function canApplyAiToListing(role: UserRole | null | undefined, listingStatus: string | null | undefined) {
  if (!canAccessAi(role)) return false;
  if (role === "AGENT") return listingStatus === "DRAFT";
  return true; // owner/manager
}

export function canUploadMedia(role: UserRole | null | undefined, listingStatus: string | null | undefined) {
  if (role === "STAFF") return false;
  if (role === "AGENT") return listingStatus === "DRAFT";
  return role === "OWNER" || role === "MANAGER";
}

