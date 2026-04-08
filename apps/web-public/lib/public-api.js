/**
 * Agency slug used in public API paths.
 * Keep demo slug as fallback so local seed flows still work.
 */
export const PUBLIC_AGENCY_SLUG =
  process.env.NEXT_PUBLIC_PUBLIC_AGENCY_SLUG || process.env.NEXT_PUBLIC_AGENCY_SLUG || "demo-agency";

let resolvedAgencySlugPromise = null;

function getSiteHostGuess() {
  if (typeof window !== "undefined" && window.location?.hostname) {
    return window.location.hostname;
  }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return "";
  try {
    return new URL(siteUrl).hostname;
  } catch {
    return "";
  }
}

async function resolvePublicAgencySlug({ listingSlug } = {}) {
  // Explicit env override always wins.
  const envSlug = process.env.NEXT_PUBLIC_PUBLIC_AGENCY_SLUG || process.env.NEXT_PUBLIC_AGENCY_SLUG;
  if (envSlug) return envSlug;

  const resolveOnce = async () => {
    const base = getPublicApiBase();
    const params = new URLSearchParams();
    const host = getSiteHostGuess();
    if (host) params.set("host", host);
    if (listingSlug) params.set("listingSlug", listingSlug);
    const res = await fetch(`${base}/public/resolve-agency?${params.toString()}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return PUBLIC_AGENCY_SLUG;
    const data = await res.json().catch(() => null);
    const slug = typeof data?.agencySlug === "string" ? data.agencySlug.trim() : "";
    return slug || PUBLIC_AGENCY_SLUG;
  };

  // Listing-scoped resolve avoids ambiguity when slugs can overlap between agencies.
  if (listingSlug) {
    return resolveOnce();
  }

  if (!resolvedAgencySlugPromise) {
    resolvedAgencySlugPromise = resolveOnce();
  }
  return resolvedAgencySlugPromise;
}

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

const DEMO_EXTRA_SAMPLE_IMAGES = [
  "https://images.unsplash.com/photo-1416331108676-a22ccb276e35?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1515263487990-61b07816b324?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?auto=format&fit=crop&w=1600&q=80",
];

const DEMO_FALLBACK_IMAGE_POOL = [...Object.values(DEMO_FALLBACK_IMAGE_BY_SLUG), ...DEMO_EXTRA_SAMPLE_IMAGES];

/**
 * Pick a stable demo image for any listing key so cards stay visually consistent.
 * @param {string | number | null | undefined} key
 * @returns {string | null}
 */
function pickDemoFallbackImageByKey(key) {
  if (DEMO_FALLBACK_IMAGE_POOL.length === 0) return null;
  const source = String(key ?? "demo-listing");
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
  }
  return DEMO_FALLBACK_IMAGE_POOL[hash % DEMO_FALLBACK_IMAGE_POOL.length] || null;
}

/**
 * @param {Record<string, any> | null | undefined} listing
 * @returns {boolean}
 */
function isDemoListing(listing) {
  const agencySlug = String(listing?.agencySlug ?? "").trim().toLowerCase();
  return agencySlug === "demo-agency";
}

/** Default API origin — keep in sync with `next.config.mjs` env default. */
const DEFAULT_PUBLIC_API_URL = "https://api.synthrstate.com";

export function getPublicApiBase() {
  const raw = process.env.NEXT_PUBLIC_API_URL || DEFAULT_PUBLIC_API_URL;
  return raw.replace(/\/$/, "");
}

/** @type {Record<string, string>} */
export const PUBLIC_PROPERTY_TYPE_LABELS = {
  APARTMENT: "Apartment",
  HOUSE: "House",
  VILLA: "Villa",
  HOTEL: "Hotel",
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
  const agencySlug = await resolvePublicAgencySlug();
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === "") continue;
    const val = Array.isArray(v) ? v[0] : v;
    if (val === undefined || val === "") continue;
    sp.set(k, String(val));
  }
  const qs = sp.toString();
  const url = `${base}/public/${agencySlug}/listings${qs ? `?${qs}` : ""}`;
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
  const data = await res.json();
  if (!Array.isArray(data?.items)) return data;
  return {
    ...data,
    items: data.items.map((item) => ({
      ...item,
      agencySlug: item?.agencySlug || agencySlug,
    })),
  };
}

/**
 * @param {string} slug
 */
export async function fetchPublicListingDetail(slug) {
  const base = getPublicApiBase();
  const agencySlug = await resolvePublicAgencySlug({ listingSlug: slug });
  const url = `${base}/public/${agencySlug}/listings/${encodeURIComponent(slug)}`;
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
  const data = await res.json();
  if (!data || typeof data !== "object") return data;
  return { ...data, agencySlug: data?.agencySlug || agencySlug };
}

/**
 * @param {string} slug
 * @param {{ name: string; email?: string; phone?: string; message?: string; turnstileToken?: string }} dto
 */
export async function createPublicInquiry(slug, dto) {
  const base = getPublicApiBase();
  const agencySlug = await resolvePublicAgencySlug({ listingSlug: slug });
  const url = `${base}/public/${agencySlug}/listings/${encodeURIComponent(slug)}/inquiries`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
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
 * @param {string | number | null | undefined} [fallbackKey]
 * @param {Record<string, any> | null | undefined} [listing]
 * @returns {string | null}
 */
export function getDemoListingFallbackImage(slug, fallbackKey, listing) {
  const slugKey = slug ? String(slug) : "";
  if (slugKey && DEMO_FALLBACK_IMAGE_BY_SLUG[slugKey]) {
    return DEMO_FALLBACK_IMAGE_BY_SLUG[slugKey];
  }
  if (!isDemoListing(listing)) return null;
  return pickDemoFallbackImageByKey(fallbackKey ?? slugKey);
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
    push(getDemoListingFallbackImage(listing?.slug, listing?.id ?? listing?.title, listing));
  }
  return out;
}
