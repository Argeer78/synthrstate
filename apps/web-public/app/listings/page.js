import Link from "next/link";
import PublicListingCard from "../../components/PublicListingCard";
import { ListingsBrowseClient } from "../../components/ListingsBrowseClient";
import { getRequestLocale } from "../../lib/i18n.server";
import { fetchPublicListings } from "../../lib/public-api";
import { getMergedMessages } from "../../lib/messages";

export const metadata = {
  title: "Demo listings — Synthr",
  description: "Sample published listings powered by the Synthr public API (demo agency).",
};

/** Fetch on each request; avoids failing `next build` when the API is unreachable. */
export const dynamic = "force-dynamic";

/** @param {Record<string, string | string[] | undefined>} sp */
function searchParamsToQuery(sp) {
  if (!sp || typeof sp !== "object") return {};
  const o = {};
  for (const [k, v] of Object.entries(sp)) {
    if (v === undefined || v === "") continue;
    o[k] = Array.isArray(v) ? v[0] : v;
  }
  return o;
}

export default async function ListingsIndexPage({ searchParams }) {
  const resolved = searchParams && typeof searchParams.then === "function" ? await searchParams : searchParams;
  const query = searchParamsToQuery(resolved ?? {});

  const locale = await getRequestLocale();
  const messages = getMergedMessages(locale);
  const L = messages.listings;

  let data;
  let errorMessage = null;

  try {
    data = await fetchPublicListings(query);
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : messages.listings.genericError;
  }

  return (
    <div className="shell listings-page">
      <header className="listings-page__header">
        <Link href="/" className="listings-page__back">
          ← {L.backBrand}
        </Link>
        <h1 className="listings-page__title">{L.demoTitle}</h1>
        <p className="listings-page__lead">{L.lead}</p>
      </header>

      <ListingsBrowseClient m={messages} />

      {errorMessage ? (
        <div className="state-block state-block--error" role="alert">
          <p className="state-block__title">{L.loadError}</p>
          <p style={{ margin: 0 }}>{errorMessage}</p>
        </div>
      ) : null}

      {!errorMessage ? (
        (() => {
          const items = Array.isArray(data?.items) ? data.items : [];
          if (items.length === 0) {
            return (
              <div className="state-block">
                <p className="state-block__title">{L.emptyTitle}</p>
                <p style={{ margin: 0 }}>{L.emptyBody}</p>
              </div>
            );
          }
          return (
            <div className="listings-grid">
              {items.map((listing) => (
                <PublicListingCard key={listing.id} listing={listing} m={messages} />
              ))}
            </div>
          );
        })()
      ) : null}
    </div>
  );
}
