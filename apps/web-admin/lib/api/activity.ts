import { apiFetch } from "../admin-api";
import { readApiError } from "./errors";

export type ActivityEvent = {
  id: string;
  createdAt: string;
  entityType: string;
  entityId: string;
  action: string;
  message?: string | null;
  leadId?: string | null;
  contactId?: string | null;
};

export async function listActivity(params: { leadId?: string; contactId?: string; take?: number }) {
  const qs = new URLSearchParams({ page: "1", pageSize: String(params.take ?? 15) });
  if (params.leadId) qs.set("leadId", params.leadId);
  if (params.contactId) qs.set("contactId", params.contactId);
  const res = await apiFetch(`/crm/activity?${qs.toString()}`, { method: "GET" });
  if (!res.ok) throw new Error(await readApiError(res));
  const data = (await res.json()) as { items: ActivityEvent[] };
  return { items: Array.isArray(data.items) ? data.items : [] };
}

