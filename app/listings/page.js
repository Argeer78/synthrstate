import Link from "next/link";
import PublicSiteFooter from "../../components/PublicSiteFooter";
import PublicListingCard from "../../components/PublicListingCard";
import { ListingsBrowseClient } from "../../components/ListingsBrowseClient";
import { fetchPublicListings } from "../../lib/public-api";
import { getMessages } from "../../lib/i18n";
import { getRequestLocale } from "../../lib/i18n.server";

export const metadata = {
  title: "Demo listings — Synthr",
  description: "Sample published listings powered by the Synthr public API (demo agency).",
};

/** Fetch on each request; avoids failing `next build` when the API is unreachable. */
export const dynamic = "force-dynamic";

/** @param {Record<string, string | string[] | undefined>} raw */
function pickQuery(raw) {
  if (!raw || typeof raw !== "object") return {};
  /** @type {Record<string, string>} */
  const out = {};
  const keys = [
    "q",
    "listingType",
    "propertyType",
    "city",
    "area",
    "minPrice",
    "maxPrice",
    "bedrooms",
    "minBedrooms",
    "maxBedrooms",
    "minBathrooms",
    "maxBathrooms",
    "minSqm",
    "maxSqm",
    "sort",
    "page",
    "pageSize",
  ];
  for (const k of keys) {
    const v = raw[k];
    if (v === undefined || v === "") continue;
    out[k] = Array.isArray(v) ? String(v[0]) : String(v);
  }
  return out;
}

/** @param {Record<string, string>} q */
function listingsHref(q) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (v !== undefined && v !== "") p.set(k, v);
  }
  const s = p.toString();
  return s ? `/listings?${s}` : "/listings";
}

export default async function ListingsIndexPage(props) {
  const locale = await getRequestLocale();
  const m = getMessages(locale);
  const sp = props.searchParams && typeof props.searchParams.then === "function" ? await props.searchParams : props.searchParams;
  const query = pickQuery(sp || {});

  let data;
  let errorMessage = null;

  try {
    data = await fetchPublicListings(query);
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : m.listings.genericError;
  }

  const pageInfo = data?.pageInfo;
  const page = typeof pageInfo?.page === "number" ? pageInfo.page : Number(query.page) || 1;
  const total = typeof pageInfo?.total === "number" ? pageInfo.total : 0;
  const pageSize = typeof pageInfo?.pageSize === "number" ? pageInfo.pageSize : 20;
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  const linkQuery = { ...query, pageSize: query.pageSize ?? String(pageSize) };

  return (
    <div className="shell listings-page">
      <header className="listings-page__header">
        <div className="listings-page__header-top">
          <Link href="/" className="listings-page__back">
            ← {m.listings.backBrand}
          </Link>
        </div>
        <h1 className="listings-page__title">{m.listings.demoTitle}</h1>
        <p className="listings-page__lead">
          {m.listings.lead.split("(demo-agency)")[0]}(<code>demo-agency</code>){m.listings.lead.split("(demo-agency)")[1]}
        </p>
      </header>

      <ListingsBrowseClient m={m} />

      {errorMessage ? (
        <div className="state-block state-block--error" role="alert">
          <p className="state-block__title">{m.listings.loadError}</p>
          <p style={{ margin: 0 }}>{errorMessage}</p>
        </div>
      ) : null}

      {!errorMessage ? (
        (() => {
          const items = Array.isArray(data?.items) ? data.items : [];
          if (items.length === 0) {
            return (
              <div className="state-block">
                <p className="state-block__title">{m.listings.emptyTitle}</p>
                <p style={{ margin: 0 }}>{m.listings.emptyBody}</p>
              </div>
            );
          }
          return (
            <>
              <div className="listings-grid">
                {items.map((listing) => (
                  <PublicListingCard key={listing.id} listing={listing} m={m} />
                ))}
              </div>
              {totalPages > 1 ? (
                <nav className="listings-pagination" aria-label="Pagination">
                  {page > 1 ? (
                    <Link className="mk-btn mk-btn--ghost" href={listingsHref({ ...linkQuery, page: String(page - 1) })}>
                      ← Previous
                    </Link>
                  ) : (
                    <span className="listings-pagination__spacer" />
                  )}
                  <span className="listings-pagination__meta">
                    Page {page} of {totalPages}
                  </span>
                  {page < totalPages ? (
                    <Link className="mk-btn mk-btn--ghost" href={listingsHref({ ...linkQuery, page: String(page + 1) })}>
                      Next →
                    </Link>
                  ) : (
                    <span className="listings-pagination__spacer" />
                  )}
                </nav>
              ) : null}
            </>
          );
        })()
      ) : null}

      <PublicSiteFooter locale={locale} />
    </div>
  );
}
