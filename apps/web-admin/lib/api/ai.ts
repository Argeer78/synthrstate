import { apiFetch } from "../admin-api";
import { readApiError } from "./errors";

export type AiTone =
  | "STANDARD"
  | "FORMAL"
  | "FRIENDLY"
  | "LUXURY"
  | "SHORT"
  | "LONG"
  | "PROFESSIONAL"
  | "CASUAL";

export async function generateListingDescription(listingId: string, tone: string) {
  const res = await apiFetch(`/ai/listings/${encodeURIComponent(listingId)}/description-generations`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ tone }),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as {
    id: string;
    generatedDescriptionEn?: string | null;
    generatedDescriptionEl?: string | null;
    status: string;
  };
}

export async function applyGeneratedDescription(generationId: string, dto: { descriptionEn: string; descriptionEl: string }) {
  const res = await apiFetch(`/ai/description-generations/${encodeURIComponent(generationId)}/apply`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as { ok: boolean };
}

export async function askHelpAssistant(question: string, pageHint?: string) {
  const res = await apiFetch(`/ai/help-assistant`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question, pageHint }),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as {
    answer: string;
    suggestedActions?: string[];
    relatedPages?: string[];
  };
}

