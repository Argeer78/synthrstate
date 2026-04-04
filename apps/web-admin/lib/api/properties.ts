import { apiFetch } from "../admin-api";
import { readApiError } from "./errors";

export type UpdatePropertyPatch = {
  ownerContactId?: string;
  address?: string;
  city?: string | null;
  area?: string | null;
  propertyType?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  energyClass?: string | null;
  features?: string[] | null;
};

export async function updateProperty(id: string, patch: UpdatePropertyPatch) {
  const res = await apiFetch(`/catalog/properties/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return await res.json();
}

