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

export type GmailStatus = { connected: boolean; gmailUserEmail: string | null; lastSyncedAt: string | null };
export type GmailThreadRow = { id: string; gmailThreadId: string; subject: string | null; snippet: string | null; fromEmail: string | null; lastMessageAt: string | null };

export async function gmailStatus(): Promise<GmailStatus> {
  return await apiFetch(`/integrations/gmail/status`, { method: "GET" });
}

export async function gmailConnectUrl(): Promise<{ url: string }> {
  return await apiFetch(`/integrations/gmail/connect`, { method: "GET" });
}

export async function gmailDisconnect(): Promise<{ ok: boolean }> {
  return await apiFetch(`/integrations/gmail/disconnect`, { method: "POST", body: JSON.stringify({}) });
}

export async function gmailSync(maxThreads = 20): Promise<{ ok: boolean; syncedThreads: number }> {
  return await apiFetch(`/integrations/gmail/sync`, { method: "POST", body: JSON.stringify({ maxThreads }) });
}

export async function listGmailThreads(params: { contactId?: string; leadId?: string }): Promise<{ items: GmailThreadRow[] }> {
  const qs = new URLSearchParams();
  if (params.contactId) qs.set("contactId", params.contactId);
  if (params.leadId) qs.set("leadId", params.leadId);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return await apiFetch(`/integrations/gmail/threads${suffix}`, { method: "GET" });
}

export async function getGmailThread(threadId: string): Promise<any> {
  const qs = new URLSearchParams({ id: threadId });
  return await apiFetch(`/integrations/gmail/thread?${qs.toString()}`, { method: "GET" });
}

export async function summarizeGmailThread(threadId: string): Promise<any> {
  return await apiFetch(`/integrations/gmail/thread/summary`, { method: "POST", body: JSON.stringify({ threadId }) });
}

export async function suggestGmailReply(threadId: string, context?: any): Promise<any> {
  return await apiFetch(`/integrations/gmail/thread/suggest-reply`, { method: "POST", body: JSON.stringify({ threadId, context }) });
}

export async function createGmailDraft(params: { threadId: string; to: string; subject: string; body: string }): Promise<any> {
  return await apiFetch(`/integrations/gmail/thread/create-draft`, { method: "POST", body: JSON.stringify(params) });
}

