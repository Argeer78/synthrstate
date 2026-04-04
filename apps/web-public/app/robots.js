function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "https://synthrstate.com";
  return raw.replace(/\/+$/, "");
}

/** @returns {import("next").MetadataRoute.Robots} */
export default function robots() {
  const site = getSiteUrl();
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${site}/sitemap.xml`,
  };
}
