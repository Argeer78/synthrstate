import { readApiError } from "./errors";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function apiFetch(path: string, init?: RequestInit) {
  const resp = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!resp.ok) throw new Error(await readApiError(resp));
  return resp.json();
}

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
  leadId?: string | null;
  listingId?: string | null;
  taskId?: string | null;
  inquiryId?: string | null;
  commentId?: string | null;
};

export async function listNotifications(take = 25): Promise<{ items: NotificationRow[]; unreadCount: number }> {
  return await apiFetch(`/notifications?take=${encodeURIComponent(String(take))}`, { method: "GET" });
}

export async function markNotificationsRead(ids: string[]): Promise<{ ok: boolean }> {
  return await apiFetch(`/notifications/mark-read`, { method: "POST", body: JSON.stringify({ ids }) });
}

export type CommentRow = {
  id: string;
  body: string;
  createdAt: string;
  createdByMembershipId?: string | null;
  createdByMembership?: { user?: { email?: string | null; fullName?: string | null } | null } | null;
};

export async function listComments(params: { targetType: "LEAD" | "LISTING" | "TASK"; targetId: string }): Promise<{ items: CommentRow[] }> {
  const qs = new URLSearchParams({ targetType: params.targetType, targetId: params.targetId });
  return await apiFetch(`/collab/comments?${qs.toString()}`, { method: "GET" });
}

export async function createComment(params: { targetType: "LEAD" | "LISTING" | "TASK"; targetId: string; body: string }): Promise<{ item: CommentRow }> {
  return await apiFetch(`/collab/comments`, { method: "POST", body: JSON.stringify(params) });
}

export type AttachmentRow = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

export async function listAttachments(params: { targetType: "LEAD" | "LISTING" | "TASK"; targetId: string }): Promise<{ items: AttachmentRow[] }> {
  const qs = new URLSearchParams({ targetType: params.targetType, targetId: params.targetId });
  return await apiFetch(`/collab/attachments?${qs.toString()}`, { method: "GET" });
}

export async function createSignedAttachmentUpload(params: {
  targetType: "LEAD" | "LISTING" | "TASK";
  targetId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}): Promise<{ attachment: any; uploadUrl: string; expiresInSeconds: number }> {
  return await apiFetch(`/collab/attachments/signed-upload`, { method: "POST", body: JSON.stringify(params) });
}

export async function completeAttachmentUpload(params: { targetType: "LEAD" | "LISTING" | "TASK"; targetId: string; attachmentId: string }): Promise<{ ok: boolean }> {
  const qs = new URLSearchParams({ targetType: params.targetType, targetId: params.targetId });
  return await apiFetch(`/collab/attachments/complete-upload?${qs.toString()}`, { method: "POST", body: JSON.stringify({ attachmentId: params.attachmentId }) });
}

export async function getAttachmentDownloadUrl(params: {
  targetType: "LEAD" | "LISTING" | "TASK";
  targetId: string;
  attachmentId: string;
}): Promise<{ url: string; expiresInSeconds: number }> {
  const qs = new URLSearchParams({ targetType: params.targetType, targetId: params.targetId, attachmentId: params.attachmentId });
  return await apiFetch(`/collab/attachments/download-url?${qs.toString()}`, { method: "GET" });
}

