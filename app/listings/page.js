import Link from "next/link";
import PublicSiteFooter from "../../components/PublicSiteFooter";
import PublicListingCard from "../../components/PublicListingCard";
import { fetchPublicListings } from "../../lib/public-api";
import { getMessages } from "../../lib/i18n";
import { getRequestLocale } from "../../lib/i18n.server";

export const metadata = {
  title: "Demo listings — Synthr",
  description: "Sample published listings powered by the Synthr public API (demo agency).",
};

/** Fetch on each request; avoids failing `next build` when the API is unreachable. */
export const dynamic = "force-dynamic";

export default async function ListingsIndexPage() {
  const locale = await getRequestLocale();
  const m = getMessages(locale);
  let data;
  let errorMessage = null;

  try {
    data = await fetchPublicListings();
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : m.listings.genericError;
  }

  return (
    <div className="shell listings-page">
      <header className="listings-page__header">
        <Link href="/" className="listings-page__back">
          ← {m.listings.backBrand}
        </Link>
        <h1 className="listings-page__title">{m.listings.demoTitle}</h1>
        <p className="listings-page__lead">
          {m.listings.lead.split("(demo-agency)")[0]}(<code>demo-agency</code>){m.listings.lead.split("(demo-agency)")[1]}
        </p>
      </header>

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
                <p style={{ margin: 0 }}>
                  {m.listings.emptyBody}
                </p>
              </div>
            );
          }
          return (
            <div className="listings-grid">
              {items.map((listing) => (
                <PublicListingCard key={listing.id} listing={listing} m={m} />
              ))}
            </div>
          );
        })()
      ) : null}

      <PublicSiteFooter />
    </div>
  );
}
