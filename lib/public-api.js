/** Demo agency slug used in public API paths (matches seed). */
export const PUBLIC_AGENCY_SLUG = "demo-agency";

const DEMO_FALLBACK_IMAGE_BY_SLUG = {
  "modern-2br-apartment-with-balcony": "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1600&q=80",
  "renovated-3br-townhome-parking-included": "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1600&q=80",
  "river-view-loft-with-high-ceilings": "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1600&q=80",
  "garden-level-home-with-storage-quiet-street": "https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=1600&q=80",
  "pet-friendly-2br-with-gym-access": "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=80",
  "lake-view-apartment-with-private-patio": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80",
  "garage-renovated-bathroom-family-home": "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1600&q=80",
  "near-transit-updated-1br-apartment": "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80",
  "corner-unit-with-bright-rooms-sold": "https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=1600&q=80",
  "balcony-bike-storage-rented": "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1600&q=80",
};

/** Default API origin — keep in sync with `next.config.mjs` env default. */
const DEFAULT_PUBLIC_API_URL = "https://api.synthrstate.com";

export function getPublicApiBase() {
  const raw =
    process.env.NEXT_PUBLIC_API_URL || DEFAULT_PUBLIC_API_URL;
  return raw.replace(/\/$/, "");
}

/** @type {Record<string, string>} */
export const PUBLIC_PROPERTY_TYPE_LABELS = {
  APARTMENT: "Apartment",
  HOUSE: "House",
  VILLA: "Villa",
  STUDIO: "Studio",
  LAND: "Land",
  COMMERCIAL: "Commercial",
  PARKING: "Parking",
  OTHER: "Other",
};

/**
 * @param {Record<string, string | string[] | undefined>} [query]
 * @returns {Promise<{ items: Array<Record<string, unknown>>; pageInfo: Record<string, unknown> }>}
 */
export async function fetchPublicListings(query = {}) {
  const base = getPublicApiBase();
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === "") continue;
    const val = Array.isArray(v) ? v[0] : v;
    if (val === undefined || val === "") continue;
    sp.set(k, String(val));
  }
  const qs = sp.toString();
  const url = `${base}/public/${PUBLIC_AGENCY_SLUG}/listings${qs ? `?${qs}` : ""}`;
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
 * @param {{ name: string; email?: string; phone?: string; message?: string; turnstileToken?: string }} dto
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
/**
 * @param {string | null | undefined} type
 * @param {{ forSale?: string; forRent?: string; dash?: string } | undefined} [labels]
 */
export function formatListingType(type, labels) {
  if (!type) return labels?.dash ?? "—";
  const t = String(type);
  if (t === "SALE") return labels?.forSale ?? "For sale";
  if (t === "RENT") return labels?.forRent ?? "For rent";
  return t.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * @param {string | null | undefined} code
 */
export function formatPropertyType(code) {
  if (!code) return "";
  return PUBLIC_PROPERTY_TYPE_LABELS[String(code)] || String(code).replace(/_/g, " ").toLowerCase();
}

/**
 * @param {string | null | undefined} slug
 * @returns {string | null}
 */
export function getDemoListingFallbackImage(slug) {
  if (!slug) return null;
  return DEMO_FALLBACK_IMAGE_BY_SLUG[String(slug)] || null;
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
  if (out.length === 0) {
    push(getDemoListingFallbackImage(listing?.slug));
  }
  return out;
}
