import Link from "next/link";
import { notFound } from "next/navigation";
import ListingDetailMedia from "../../../components/ListingDetailMedia";
import ListingInquirySection from "../../../components/ListingInquirySection";
import {
  collectListingImageUrls,
  fetchPublicListingDetail,
  formatListingType,
  formatPrice,
} from "../../../lib/public-api";

export const dynamic = "force-dynamic";

function SpecRow({ label, value }) {
  if (value == null || value === "") return null;
  return (
    <div className="detail-spec-row">
      <dt className="detail-spec-row__label">{label}</dt>
      <dd className="detail-spec-row__value">{value}</dd>
    </div>
  );
}

export default async function ListingDetailPage({ params }) {
  const { slug } = await params;
  let listing;
  let errorMessage = null;

  try {
    listing = await fetchPublicListingDetail(slug);
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : "Something went wrong";
  }

  if (errorMessage) {
    return (
      <div className="shell">
        <Link href="/listings" className="detail-back">
          ← Back to listings
        </Link>
        <div className="state-block state-block--error" role="alert">
          <p className="state-block__title">Could not load this listing</p>
          <p style={{ margin: 0 }}>{errorMessage}</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    notFound();
  }

  const title = listing.title || "Listing";
  const images = collectListingImageUrls(listing);
  const city = listing.property?.city;
  const area = listing.property?.area;
  const address = listing.property?.address;

  const description =
    typeof listing.description === "string" && listing.description.trim()
      ? listing.description.trim()
      : null;

  return (
    <div className="shell shell--detail">
      <Link href="/listings" className="detail-back">
        ← Back to listings
      </Link>

      <article className="detail-page">
        <header className="detail-page__header">
          <h1 className="detail-page__title">{title}</h1>
          <div className="detail-page__price-row">
            <span className="detail-page__price">{formatPrice(listing.price, listing.currency)}</span>
            <span className="detail-page__badge">{formatListingType(listing.listingType)}</span>
          </div>
        </header>

        <div className="detail-page__layout">
          <ListingDetailMedia images={images} title={title} />

          <aside className="detail-specs" aria-labelledby="specs-heading">
            <h2 id="specs-heading" className="detail-specs__title">
              Property details
            </h2>
            <dl className="detail-specs__list">
              <SpecRow
                label="Bedrooms"
                value={listing.bedrooms != null ? String(listing.bedrooms) : null}
              />
              <SpecRow
                label="Bathrooms"
                value={listing.bathrooms != null ? String(listing.bathrooms) : null}
              />
              <SpecRow label="Internal area" value={listing.sqm != null ? `${listing.sqm} m²` : null} />
              <SpecRow label="City" value={city || null} />
              <SpecRow label="Area" value={area || null} />
              <SpecRow label="Address" value={address || null} />
            </dl>
          </aside>
        </div>

        <section className="detail-description" aria-labelledby="desc-heading">
          <h2 id="desc-heading" className="detail-description__title">
            Description
          </h2>
          {description ? (
            <div className="detail-description__body">{description}</div>
          ) : (
            <p className="detail-description__empty">No description has been published for this listing.</p>
          )}
        </section>

        <ListingInquirySection listingTitle={title} />
      </article>
    </div>
  );
}
