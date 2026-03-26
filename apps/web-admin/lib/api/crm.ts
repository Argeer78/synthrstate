import { apiFetch } from "../admin-api";
import { readApiError } from "./errors";

export type Contact = {
  id: string;
  firstName?: string;
  lastName?: string;
  organizationName?: string | null;
  email?: string | null;
  phone?: string | null;
};

export type Lead = {
  id: string;
  title?: string | null;
  status: string;
  contactId: string;
  assignedToMembershipId?: string | null;
  contact?: Contact;
};

export type Task = {
  id: string;
  title: string;
  status: string;
  dueAt?: string | null;
  leadId?: string | null;
  assignedToMembershipId?: string | null;
};

export type Inquiry = {
  id: string;
  status: string;
  source: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
  createdAt: string;
  listing: { id: string; title: string; slug: string };
  leadId?: string | null;
};

export async function listContacts() {
  const res = await apiFetch("/crm/contacts?page=1&pageSize=50");
  if (!res.ok) throw new Error(await readApiError(res));
  const data = (await res.json()) as { items: Contact[]; pageInfo?: { total?: number } };
  return { items: Array.isArray(data.items) ? data.items : [], total: data.pageInfo?.total ?? data.items?.length ?? 0 };
}

export async function getContact(id: string) {
  const res = await apiFetch(`/crm/contacts/${encodeURIComponent(id)}`, { method: "GET" });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as Contact & { createdAt?: string; type?: string };
}

export async function createContact(dto: Partial<Contact>) {
  const res = await apiFetch("/crm/contacts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as Contact;
}

export async function updateContact(id: string, dto: Partial<Contact>) {
  const res = await apiFetch(`/crm/contacts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as Contact;
}

export async function deleteContact(id: string) {
  const res = await apiFetch(`/crm/contacts/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as { ok: boolean };
}

export async function listLeads() {
  const res = await apiFetch("/crm/leads?page=1&pageSize=50");
  if (!res.ok) throw new Error(await readApiError(res));
  const data = (await res.json()) as { items: Lead[]; pageInfo?: { total?: number } };
  return { items: Array.isArray(data.items) ? data.items : [], total: data.pageInfo?.total ?? data.items?.length ?? 0 };
}

export async function listLeadsForContact(contactId: string) {
  const qs = new URLSearchParams({ page: "1", pageSize: "50", contactId });
  const res = await apiFetch(`/crm/leads?${qs.toString()}`);
  if (!res.ok) throw new Error(await readApiError(res));
  const data = (await res.json()) as { items: Lead[]; pageInfo?: { total?: number } };
  return { items: Array.isArray(data.items) ? data.items : [], total: data.pageInfo?.total ?? data.items?.length ?? 0 };
}

export async function getLead(id: string) {
  const res = await apiFetch(`/crm/leads/${encodeURIComponent(id)}`, { method: "GET" });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as Lead & { contact?: Contact; createdAt?: string; assignedToMembershipId?: string | null };
}

export async function createLead(dto: { contactId: string; title?: string; status?: string; assignedToMembershipId?: string }) {
  const res = await apiFetch("/crm/leads", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as Lead;
}

export async function updateLead(id: string, dto: { title?: string; status?: string; assignedToMembershipId?: string }) {
  const res = await apiFetch(`/crm/leads/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as Lead;
}

export async function deleteLead(id: string) {
  const res = await apiFetch(`/crm/leads/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as { ok: boolean };
}

export async function listTasks(params?: { leadId?: string }) {
  const qs = new URLSearchParams({ page: "1", pageSize: "50" });
  if (params?.leadId) qs.set("leadId", params.leadId);
  const res = await apiFetch(`/crm/tasks?${qs.toString()}`);
  if (!res.ok) throw new Error(await readApiError(res));
  const data = (await res.json()) as { items: Task[]; pageInfo?: { total?: number } };
  return { items: Array.isArray(data.items) ? data.items : [], total: data.pageInfo?.total ?? data.items?.length ?? 0 };
}

export async function listInquiries(params?: { leadId?: string }) {
  const qs = new URLSearchParams({ page: "1", pageSize: "50" });
  if (params?.leadId) qs.set("leadId", params.leadId);
  const res = await apiFetch(`/crm/inquiries?${qs.toString()}`);
  if (!res.ok) throw new Error(await readApiError(res));
  const data = (await res.json()) as { items: Inquiry[]; pageInfo?: { total?: number } };
  return { items: Array.isArray(data.items) ? data.items : [], total: data.pageInfo?.total ?? data.items?.length ?? 0 };
}

export type Note = {
  id: string;
  content: string;
  createdAt: string;
  leadId?: string | null;
  contactId?: string | null;
};

export async function listNotes(params: { leadId?: string; contactId?: string }) {
  const qs = new URLSearchParams({ page: "1", pageSize: "50" });
  if (params.leadId) qs.set("leadId", params.leadId);
  if (params.contactId) qs.set("contactId", params.contactId);
  const res = await apiFetch(`/crm/notes?${qs.toString()}`);
  if (!res.ok) throw new Error(await readApiError(res));
  const data = (await res.json()) as { items: Note[]; pageInfo?: { total?: number } };
  return { items: Array.isArray(data.items) ? data.items : [] };
}

export async function createLeadNote(params: { leadId: string; content: string }) {
  const res = await apiFetch("/crm/notes", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ leadId: params.leadId, content: params.content }),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as Note;
}

export async function createContactNote(params: { contactId: string; content: string }) {
  const res = await apiFetch("/crm/notes", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ contactId: params.contactId, content: params.content }),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as Note;
}

export async function deleteNote(id: string) {
  const res = await apiFetch(`/crm/notes/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as { ok: boolean };
}

export async function updateNote(id: string, dto: { content: string }) {
  const res = await apiFetch(`/crm/notes/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as Note;
}

export async function convertInquiry(inquiryId: string) {
  const res = await apiFetch(`/crm/inquiries/${encodeURIComponent(inquiryId)}/convert`, { method: "POST" });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as {
    ok: boolean;
    inquiryId: string;
    leadId: string;
    contactId: string;
    alreadyConverted: boolean;
    reusedContact: boolean;
  };
}

export async function createTask(dto: { title: string; description?: string; dueAt?: string; leadId?: string; assignedToMembershipId?: string; status?: string }) {
  const res = await apiFetch("/crm/tasks", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as Task;
}

export async function updateTask(id: string, dto: { title?: string; description?: string; dueAt?: string; assignedToMembershipId?: string; status?: string }) {
  const res = await apiFetch(`/crm/tasks/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as Task;
}

export async function deleteTask(id: string) {
  const res = await apiFetch(`/crm/tasks/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as { ok: boolean };
}

