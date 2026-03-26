import { apiFetch } from "../admin-api";
import { readApiError } from "./errors";

export type DashboardResponse = {
  counts: {
    totalContacts: number;
    totalLeads: number;
    newInquiries: number;
    activeListings: number;
    tasksDueSoon: number;
  };
  recent: Array<{
    type: string;
    at: string;
    title: string;
    subtitle?: string;
    inquiryId?: string;
    listingTitle?: string;
    entityType?: string;
    action?: string;
    entityId?: string;
  }>;
};

export async function fetchDashboard(): Promise<DashboardResponse> {
  const res = await apiFetch("/dashboard", { method: "GET" });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as DashboardResponse;
}

