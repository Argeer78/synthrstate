import { apiFetch } from "../admin-api";
import { readApiError } from "./errors";

export type PublicationChannelCode = "WEBSITE" | "XML_FEED" | "PORTAL";

export type PublicationLogStatus = "STARTED" | "SUCCESS" | "FAILED";

export type ListingPublicationStatus = "QUEUED" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "RETRYING" | "CANCELLED" | null;

export type ListingPublicationChannelState = {
  code: PublicationChannelCode;
  displayName: string;
  channelType: string;
  publicationStatus: ListingPublicationStatus;
  selected: boolean;
  lastSync: null | {
    startedAt: string;
    finishedAt: string | null;
    status: PublicationLogStatus;
    message: string | null;
    action: string | null;
  };
};

export type ListingPublicationsResponse = {
  listingId: string;
  channels: ListingPublicationChannelState[];
  lastAttempt: string | null;
  lastSuccess: string | null;
  lastFailure: string | null;
  selectedChannelCodes: PublicationChannelCode[];
};

export type ListingPublicationLogRow = {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  attemptNo: number;
  status: PublicationLogStatus;
  channelCode: PublicationChannelCode | null;
  channelDisplayName: string | null;
  action: string | null;
  message: string | null;
};

export async function getListingPublications(listingId: string) {
  const res = await apiFetch(`/catalog/listings/${encodeURIComponent(listingId)}/publications`, { method: "GET" });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as ListingPublicationsResponse;
}

export async function getListingPublicationLogs(listingId: string, params?: { page?: number; pageSize?: number }) {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  const res = await apiFetch(`/catalog/listings/${encodeURIComponent(listingId)}/publication-logs?page=${page}&pageSize=${pageSize}`, {
    method: "GET",
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as { items: ListingPublicationLogRow[]; total: number };
}

export async function publishListingChannels(listingId: string, dto: { channels: PublicationChannelCode[] }) {
  const res = await apiFetch(`/catalog/listings/${encodeURIComponent(listingId)}/publications/publish`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as { ok: boolean };
}

export async function unpublishListingChannels(listingId: string, dto: { channels: PublicationChannelCode[] }) {
  const res = await apiFetch(`/catalog/listings/${encodeURIComponent(listingId)}/publications/unpublish`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as { ok: boolean };
}

export async function retryListingChannels(listingId: string, dto: { channels: PublicationChannelCode[] }) {
  const res = await apiFetch(`/catalog/listings/${encodeURIComponent(listingId)}/publications/retry`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as { ok: boolean };
}

export async function refreshListingPublications(listingId: string) {
  const res = await apiFetch(`/catalog/listings/${encodeURIComponent(listingId)}/publications/refresh`, { method: "POST" });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as ListingPublicationsResponse;
}

