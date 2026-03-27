import Link from "next/link";
import PublicListingCard from "../../components/PublicListingCard";
import { fetchPublicListings } from "../../lib/public-api";

export const metadata = {
  title: "Demo listings — Synthr",
  description: "Sample published listings powered by the Synthr public API (demo agency).",
};

/** Fetch on each request; avoids failing `next build` when the API is unreachable. */
export const dynamic = "force-dynamic";

export default async function ListingsIndexPage() {
  let data;
  let errorMessage = null;

  try {
    data = await fetchPublicListings();
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : "Something went wrong";
  }

  return (
    <div className="shell listings-page">
      <header className="listings-page__header">
        <Link href="/" className="listings-page__back">
          ← Synthr
        </Link>
        <h1 className="listings-page__title">Demo listings</h1>
        <p className="listings-page__lead">
          Live data from the Synthr public API (<code>demo-agency</code>). This page is for product preview, not
          the marketing homepage.
        </p>
      </header>

      {errorMessage ? (
        <div className="state-block state-block--error" role="alert">
          <p className="state-block__title">Could not load listings</p>
          <p style={{ margin: 0 }}>{errorMessage}</p>
        </div>
      ) : null}

      {!errorMessage ? (
        (() => {
          const items = Array.isArray(data?.items) ? data.items : [];
          if (items.length === 0) {
            return (
              <div className="state-block">
                <p className="state-block__title">No published listings</p>
                <p style={{ margin: 0 }}>
                  When your agency publishes active listings in Synthr, they will appear here.
                </p>
              </div>
            );
          }
          return (
            <div className="listings-grid">
              {items.map((listing) => (
                <PublicListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          );
        })()
      ) : null}
    </div>
  );
}
