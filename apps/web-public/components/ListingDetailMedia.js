/**
 * @param {{ images: string[]; title: string }} props
 */
export default function ListingDetailMedia({ images, title }) {
  if (!images.length) {
    return (
      <div className="detail-media detail-media--empty" aria-label="Property photos">
        <p>No photos available for this listing.</p>
      </div>
    );
  }

  const [primary, ...rest] = images;

  return (
    <div className="detail-media" aria-label="Property photos">
      <div className="detail-media__hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={primary} alt={title ? `${title} — main photo` : "Property main photo"} />
      </div>
      {rest.length > 0 ? (
        <ul className="detail-media__grid">
          {rest.map((url, i) => (
            <li key={`${url}-${i}`} className="detail-media__cell">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" loading="lazy" />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
