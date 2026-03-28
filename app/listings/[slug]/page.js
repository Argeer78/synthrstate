import Link from "next/link";
import { notFound } from "next/navigation";
import PublicLanguageSwitcher from "../../../components/PublicLanguageSwitcher";
import PublicSiteFooter from "../../../components/PublicSiteFooter";
import ListingDetailMedia from "../../../components/ListingDetailMedia";
import ListingInquirySection from "../../../components/ListingInquirySection";
import {
  collectListingImageUrls,
  fetchPublicListingDetail,
  formatListingType,
  formatPrice,
} from "../../../lib/public-api";
import { getMessages } from "../../../lib/i18n";
import { getRequestLocale } from "../../../lib/i18n.server";

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
  const locale = await getRequestLocale();
  const m = getMessages(locale);
  const { slug } = await params;
  let listing;
  let errorMessage = null;

  try {
    listing = await fetchPublicListingDetail(slug);
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : null;
  }

  if (errorMessage) {
    return (
      <div className="shell">
        <div className="detail-page__top">
          <Link href="/listings" className="detail-back">
            ← {m.listings.backToListings}
          </Link>
          <PublicLanguageSwitcher locale={locale} />
        </div>
        <div className="state-block state-block--error" role="alert">
          <p className="state-block__title">{m.listings.detailError}</p>
          <p style={{ margin: 0 }}>{errorMessage}</p>
        </div>
        <PublicSiteFooter locale={locale} />
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
        ← {m.listings.backToListings}
      </Link>

      <article className="detail-page">
        <header className="detail-page__header">
          <h1 className="detail-page__title">{title}</h1>
          <div className="detail-page__price-row">
            <span className="detail-page__price">{formatPrice(listing.price, listing.currency)}</span>
            <span className="detail-page__badge">{formatListingType(listing.listingType, m.card)}</span>
          </div>
        </header>

        <div className="detail-page__layout">
          <ListingDetailMedia images={images} title={title} m={m} />

          <aside className="detail-specs" aria-labelledby="specs-heading">
            <h2 id="specs-heading" className="detail-specs__title">
              {m.listings.detailsTitle}
            </h2>
            <dl className="detail-specs__list">
              <SpecRow
                label={m.listings.bedrooms}
                value={listing.bedrooms != null ? String(listing.bedrooms) : null}
              />
              <SpecRow
                label={m.listings.bathrooms}
                value={listing.bathrooms != null ? String(listing.bathrooms) : null}
              />
              <SpecRow label={m.listings.internalArea} value={listing.sqm != null ? `${listing.sqm} m²` : null} />
              <SpecRow label={m.listings.city} value={city || null} />
              <SpecRow label={m.listings.area} value={area || null} />
              <SpecRow label={m.listings.address} value={address || null} />
            </dl>
          </aside>
        </div>

        <section className="detail-description" aria-labelledby="desc-heading">
          <h2 id="desc-heading" className="detail-description__title">
            {m.listings.description}
          </h2>
          {description ? (
            <div className="detail-description__body">{description}</div>
          ) : (
            <p className="detail-description__empty">{m.listings.noDescription}</p>
          )}
        </section>

        <ListingInquirySection listingTitle={title} listingSlug={slug} m={m} />
      </article>

      <PublicSiteFooter locale={locale} />
    </div>
  );
}
