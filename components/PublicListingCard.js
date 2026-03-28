import Link from "next/link";
import { formatListingType, formatPrice, formatPropertyType, getDemoListingFallbackImage } from "../lib/public-api";

/**
 * @param {{ listing: Record<string, any>; m: Record<string, any> }} props
 */
export default function PublicListingCard({ listing, m }) {
  const card = m.card;
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
    [city, area].filter(Boolean).join(" · ") || property?.address || card.dash;
  const coverUrl = cover?.url || getDemoListingFallbackImage(slug);

  const bedLabel =
    bedrooms != null
      ? `${bedrooms} ${bedrooms === 1 ? card.bed : card.beds}`
      : `${card.dash} ${card.beds}`;

  const propType = formatPropertyType(property?.propertyType);

  return (
    <Link href={`/listings/${slug}`} className="listing-card">
      <div className="listing-card__media">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt={title || card.untitled} className="listing-card__img" />
        ) : (
          <div className="listing-card__placeholder">{card.noPhoto}</div>
        )}
      </div>
      <div className="listing-card__body">
        <h2 className="listing-card__title">{title || card.untitled}</h2>
        <p className="listing-card__price">{formatPrice(price, currency)}</p>
        <p className="listing-card__meta">{location}</p>
        <ul className="listing-card__facts">
          <li>{bedLabel}</li>
          <li>{sqm != null ? `${sqm} ${card.m2}` : `${card.dash} ${card.m2}`}</li>
          <li>{formatListingType(listingType, card)}</li>
          {propType ? <li>{propType}</li> : null}
        </ul>
      </div>
    </Link>
  );
}
