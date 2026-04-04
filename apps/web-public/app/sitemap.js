import { fetchPublicListings } from "../lib/public-api";

/** Canonical public site origin (no trailing slash). Override via NEXT_PUBLIC_SITE_URL at build time. */
function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "https://synthrstate.com";
  return raw.replace(/\/+$/, "");
}

/** @returns {import("next").MetadataRoute.Sitemap} */
export default async function sitemap() {
  const site = getSiteUrl();
  const now = new Date();

  /** @type {import("next").MetadataRoute.Sitemap} */
  const routes = [
    { url: `${site}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${site}/listings`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${site}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${site}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${site}/cookies`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
  ];

  try {
    const data = await fetchPublicListings();
    const items = Array.isArray(data?.items) ? data.items : [];
    for (const listing of items) {
      const slug = listing?.slug;
      if (typeof slug !== "string" || !slug) continue;
      const rawDate = listing.updatedAt ?? listing.createdAt;
      const lastModified =
        rawDate != null ? new Date(String(rawDate)) : now;
      routes.push({
        url: `${site}/listings/${slug}`,
        lastModified: Number.isNaN(lastModified.getTime()) ? now : lastModified,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch {
    /* API unavailable (e.g. offline build): static URLs only */
  }

  return routes;
}
