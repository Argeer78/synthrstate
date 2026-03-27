/** Demo agency slug used in public API paths (matches seed). */
export const PUBLIC_AGENCY_SLUG = "demo-agency";

/** Default API origin — keep in sync with `next.config.mjs` env default. */
const DEFAULT_PUBLIC_API_URL = "https://api.synthrstate.com";

export function getPublicApiBase() {
  const raw =
    process.env.NEXT_PUBLIC_API_URL || DEFAULT_PUBLIC_API_URL;
  return raw.replace(/\/$/, "");
}

/**
 * @returns {Promise<{ items: Array<Record<string, unknown>>; pageInfo: Record<string, unknown> }>}
 */
export async function fetchPublicListings() {
  const base = getPublicApiBase();
  const url = `${base}/public/${PUBLIC_AGENCY_SLUG}/listings`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Listings request failed (${res.status} ${res.statusText})${text ? `: ${text.slice(0, 200)}` : ""}`,
    );
  }
  return res.json();
}

/**
 * @param {string} slug
 */
export async function fetchPublicListingDetail(slug) {
  const base = getPublicApiBase();
  const url = `${base}/public/${PUBLIC_AGENCY_SLUG}/listings/${encodeURIComponent(slug)}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Listing request failed (${res.status} ${res.statusText})${text ? `: ${text.slice(0, 200)}` : ""}`,
    );
  }
  return res.json();
}

/**
 * @param {string} slug
 * @param {{ name: string; email?: string; phone?: string; message?: string }} dto
 */
export async function createPublicInquiry(slug, dto) {
  const base = getPublicApiBase();
  const url = `${base}/public/${PUBLIC_AGENCY_SLUG}/listings/${encodeURIComponent(slug)}/inquiries`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // Nest often returns JSON with `message`
    try {
      const j = text ? JSON.parse(text) : null;
      const msg = j?.message;
      if (Array.isArray(msg)) throw new Error(msg.map(String).join("; "));
      if (typeof msg === "string" && msg.trim()) throw new Error(msg);
    } catch (e) {
      if (e instanceof Error && e.message) throw e;
    }
    throw new Error(`Inquiry failed (${res.status} ${res.statusText})${text ? `: ${text.slice(0, 200)}` : ""}`);
  }
  return res.json();
}

/**
 * @param {number | null | undefined} amount
 * @param {string | null | undefined} currency
 */
export function formatPrice(amount, currency) {
  if (amount == null || Number.isNaN(Number(amount))) return "—";
  const code = (currency || "EUR").toString().toUpperCase();
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch {
    return `${amount} ${code}`;
  }
}

/**
 * @param {string | null | undefined} type
 */
export function formatListingType(type) {
  if (!type) return "—";
  const t = String(type);
  if (t === "SALE") return "For sale";
  if (t === "RENT") return "For rent";
  return t.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * Cover first, then gallery URLs, de-duplicated (API may repeat cover in gallery).
 * @param {Record<string, any>} listing
 * @returns {string[]}
 */
export function collectListingImageUrls(listing) {
  const seen = new Set();
  const out = [];
  const push = (url) => {
    if (typeof url !== "string" || !url || seen.has(url)) return;
    seen.add(url);
    out.push(url);
  };
  push(listing?.cover?.url);
  const gallery = Array.isArray(listing?.gallery) ? listing.gallery : [];
  for (const g of gallery) {
    push(g?.url);
  }
  return out;
}
