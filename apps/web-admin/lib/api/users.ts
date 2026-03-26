import { apiFetch } from "../admin-api";
import { readApiError } from "./errors";
import type { UserRole } from "../../utils/permissions";

export type UserStatus = "ACTIVE" | "DISABLED";

export type TeamMember = {
  membershipId: string;
  userId: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  status: UserStatus;
  joinedAt: string;
  createdAt: string;
};

export async function listTeamMembers(params?: { page?: number; pageSize?: number }) {
  const qs = new URLSearchParams({
    page: String(params?.page ?? 1),
    pageSize: String(params?.pageSize ?? 50),
  });
  const res = await apiFetch(`/admin/users?${qs.toString()}`);
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as { items: TeamMember[]; pageInfo?: { total?: number } };
}

export async function createTeamMember(dto: { fullName?: string; email: string; password: string; role: UserRole }) {
  const res = await apiFetch(`/admin/users`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as TeamMember;
}

export async function updateTeamMember(membershipId: string, dto: { role?: UserRole; status?: UserStatus; force?: boolean }) {
  const res = await apiFetch(`/admin/users/${encodeURIComponent(membershipId)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as TeamMember;
}

export async function resetTeamMemberPassword(membershipId: string, dto: { newPassword: string; force?: boolean }) {
  const res = await apiFetch(`/admin/users/${encodeURIComponent(membershipId)}/reset-password`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as { ok: true };
}

