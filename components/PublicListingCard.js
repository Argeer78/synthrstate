import Link from "next/link";
import { formatListingType, formatPrice, getDemoListingFallbackImage } from "../lib/public-api";

/**
 * @param {{ listing: Record<string, any> }} props
 */
export default function PublicListingCard({ listing }) {
  const {
    slug,
    title,
    price,
    currency,
    bedrooms,
    sqm,
    listingType,
    property,
    cover,
  } = listing;

  const city = property?.city;
  const area = property?.area;
  const location =
    [city, area].filter(Boolean).join(" · ") || property?.address || "—";
  const coverUrl = cover?.url || getDemoListingFallbackImage(slug);

  return (
    <Link href={`/listings/${slug}`} className="listing-card">
      <div className="listing-card__media">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt={title || "Listing photo"} className="listing-card__img" />
        ) : (
          <div className="listing-card__placeholder">No photo</div>
        )}
      </div>
      <div className="listing-card__body">
        <h2 className="listing-card__title">{title || "Untitled"}</h2>
        <p className="listing-card__price">{formatPrice(price, currency)}</p>
        <p className="listing-card__meta">{location}</p>
        <ul className="listing-card__facts">
          <li>{bedrooms != null ? `${bedrooms} bed` : "— bed"}</li>
          <li>{sqm != null ? `${sqm} m²` : "— m²"}</li>
          <li>{formatListingType(listingType)}</li>
        </ul>
      </div>
    </Link>
  );
}
