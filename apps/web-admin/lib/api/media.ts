import { apiFetch } from "../admin-api";
import { readApiError } from "./errors";

export type MediaAsset = {
  id: string;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  uploadStatus: string;
  isCover: boolean;
  createdAt?: string;
};

export async function listListingMedia(listingId: string) {
  const res = await apiFetch(`/catalog/listings/${encodeURIComponent(listingId)}/media?page=1&pageSize=100&includeDeleted=false`);
  if (!res.ok) throw new Error(await readApiError(res));
  const data = (await res.json()) as { items: MediaAsset[] };
  return { items: Array.isArray(data.items) ? data.items : [] };
}

export async function createImageUpload(listingId: string, params: { fileName: string; contentType: string; sizeBytes: number }) {
  const res = await apiFetch(`/catalog/listings/${encodeURIComponent(listingId)}/media/images/upload`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as { uploadUrl: string; mediaAsset: { id: string } };
}

export async function completeUpload(listingId: string, assetId: string, etag?: string) {
  const res = await apiFetch(`/catalog/listings/${encodeURIComponent(listingId)}/media/${encodeURIComponent(assetId)}/complete`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ etag }),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as { ok: boolean };
}

export async function deleteMediaAsset(listingId: string, assetId: string) {
  const res = await apiFetch(`/catalog/listings/${encodeURIComponent(listingId)}/media/${encodeURIComponent(assetId)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as { ok: boolean };
}

