import { apiFetch } from "../admin-api";
import { readApiError } from "./errors";

export type ListingRow = {
  id: string;
  title: string;
  status: string;
  slug: string;
  originalLanguageCode?: string;
  description?: string;
  descriptionEl?: string | null;
  translations?: Array<{
    id: string;
    languageCode: string;
    title: string;
    description: string;
    shortDescription?: string | null;
    translatedBy?: "AI" | "HUMAN";
    translatedAt?: string | null;
    reviewStatus?: "DRAFT" | "REVIEWED" | "APPROVED";
  }>;
  price?: number | null;
  currency?: string | null;
  listingType?: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  sqm?: number | null;
  createdAt?: string;
  property?: {
    id: string;
    address?: string;
    city?: string | null;
    area?: string | null;
    ownerContact?: {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      organizationName?: string | null;
      email?: string | null;
    } | null;
  };
};

export type PropertyRow = {
  id: string;
  address: string;
  city?: string | null;
  area?: string | null;
  energyClass?: string | null;
};

export type ListingListFilters = {
  q?: string;
  listingType?: "SALE" | "RENT" | "";
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED" | "SOLD" | "RENTED" | "";
  city?: string;
  area?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
};

export async function listListings(filters: ListingListFilters = {}) {
  const params = new URLSearchParams({ page: "1", pageSize: "50" });
  if (filters.q?.trim()) params.set("q", filters.q.trim());
  if (filters.listingType) params.set("listingType", filters.listingType);
  if (filters.status) params.set("status", filters.status);
  if (filters.city?.trim()) params.set("city", filters.city.trim());
  if (filters.area?.trim()) params.set("area", filters.area.trim());
  if (typeof filters.minPrice === "number" && Number.isFinite(filters.minPrice)) params.set("minPrice", String(filters.minPrice));
  if (typeof filters.maxPrice === "number" && Number.isFinite(filters.maxPrice)) params.set("maxPrice", String(filters.maxPrice));
  if (typeof filters.bedrooms === "number" && Number.isFinite(filters.bedrooms)) params.set("bedrooms", String(filters.bedrooms));
  if (typeof filters.bathrooms === "number" && Number.isFinite(filters.bathrooms)) params.set("bathrooms", String(filters.bathrooms));

  const res = await apiFetch(`/catalog/listings?${params.toString()}`);
  if (!res.ok) throw new Error(await readApiError(res));
  const data = (await res.json()) as { items: ListingRow[]; pageInfo?: { total?: number } };
  return { items: Array.isArray(data.items) ? data.items : [], total: data.pageInfo?.total ?? data.items?.length ?? 0 };
}

export async function getListing(id: string) {
  const res = await apiFetch(`/catalog/listings/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as ListingRow;
}

export async function updateListing(id: string, patch: Partial<Pick<ListingRow, "title" | "description" | "descriptionEl" | "status">>) {
  const res = await apiFetch(`/catalog/listings/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as ListingRow;
}

export async function updateListingDetails(
  id: string,
  patch: Partial<
    Pick<ListingRow, "title" | "description" | "descriptionEl" | "status" | "price" | "currency" | "bedrooms" | "bathrooms" | "sqm">
  >,
) {
  const res = await apiFetch(`/catalog/listings/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as ListingRow;
}

export async function publishListing(id: string) {
  return updateListing(id, { status: "ACTIVE" });
}

export async function deleteListing(id: string) {
  const res = await apiFetch(`/catalog/listings/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as { ok: boolean };
}

export async function createProperty(dto: {
  ownerContactId: string;
  address: string;
  city?: string;
  area?: string;
  energyClass?: "A" | "B" | "C" | "D" | "E" | "F" | "G" | "UNKNOWN";
  features?: string[];
}) {
  const res = await apiFetch("/catalog/properties", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as PropertyRow;
}

export async function createListing(dto: {
  propertyId: string;
  listingType: "SALE" | "RENT";
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED" | "SOLD" | "RENTED";
  title: string;
  description: string;
  price?: number;
  currency?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqm?: number;
}) {
  const res = await apiFetch("/catalog/listings", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as ListingRow;
}

export type ListingTranslationRow = {
  id: string;
  languageCode: string;
  title: string;
  description: string;
  shortDescription?: string | null;
  translatedBy: "AI" | "HUMAN";
  translatedAt?: string | null;
  reviewStatus: "DRAFT" | "REVIEWED" | "APPROVED";
  reviewedAt?: string | null;
};

export async function listListingTranslations(listingId: string) {
  const res = await apiFetch(`/catalog/listings/${encodeURIComponent(listingId)}/translations`);
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as {
    original: { languageCode: string; title: string; description: string };
    items: ListingTranslationRow[];
  };
}

export async function saveListingTranslation(
  listingId: string,
  languageCode: string,
  dto: { title: string; description: string; shortDescription?: string; reviewStatus?: "DRAFT" | "REVIEWED" | "APPROVED" },
) {
  const res = await apiFetch(`/catalog/listings/${encodeURIComponent(listingId)}/translations/${encodeURIComponent(languageCode)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ languageCode, ...dto }),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as ListingTranslationRow;
}

export async function aiTranslateListing(listingId: string, targetLanguage: string, overwrite = false) {
  const res = await apiFetch(`/ai/listings/${encodeURIComponent(listingId)}/translate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ targetLanguage, overwrite }),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return await res.json();
}

export async function aiBulkTranslateListings(dto: { listingIds?: string[]; allEligible?: boolean; targetLanguage: string; overwrite?: boolean }) {
  const res = await apiFetch(`/ai/listings/bulk-translate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return await res.json();
}

export type ListingInternalNote = {
  id: string;
  listingId: string;
  content: string;
  createdAt: string;
};

export async function listListingInternalNotes(listingId: string) {
  const res = await apiFetch(`/catalog/listings/${encodeURIComponent(listingId)}/internal-notes?page=1&pageSize=50`, { method: "GET" });
  if (!res.ok) throw new Error(await readApiError(res));
  const data = (await res.json()) as { items: ListingInternalNote[] };
  return { items: Array.isArray(data.items) ? data.items : [] };
}

export async function createListingInternalNote(listingId: string, content: string) {
  const res = await apiFetch(`/catalog/listings/${encodeURIComponent(listingId)}/internal-notes`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as ListingInternalNote;
}

