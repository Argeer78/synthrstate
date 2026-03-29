"use client";

import { useCallback, useMemo, useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Counter from "yet-another-react-lightbox/plugins/counter";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";

/**
 * Property gallery: hero + thumbnail strip, full-screen lightbox with navigation & swipe.
 * @param {{ images: string[]; title: string; m?: Record<string, any> }} props
 */
export default function ListingDetailMedia({ images, title, m }) {
  const openGalleryLabel = m?.listings?.openGallery ?? "Open full-size gallery";
  const viewPhotoLabel = m?.listings?.viewPhotoN ?? "View photo";

  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const slides = useMemo(
    () =>
      images.map((src, i) => ({
        src,
        alt: title ? `${title} — photo ${i + 1}` : `Property photo ${i + 1}`,
      })),
    [images, title],
  );

  const openLightbox = useCallback((index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const onView = useCallback(({ index }) => {
    setLightboxIndex(index);
    setActiveIndex(index);
  }, []);

  if (!images.length) {
    return (
      <div className="detail-media detail-media--empty" aria-label="Property photos">
        <p>{m?.listings?.noPhotos ?? "No photos available for this listing."}</p>
      </div>
    );
  }

  const currentSrc = images[activeIndex] ?? images[0];
  const showThumbs = images.length > 1;

  return (
    <div className="detail-media" aria-label="Property photos">
      <div className="detail-media__hero-wrap">
        <button
          type="button"
          className="detail-media__hero-btn"
          onClick={() => openLightbox(activeIndex)}
          aria-label={openGalleryLabel}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentSrc}
            alt={title ? `${title} — main photo` : "Property main photo"}
            className="detail-media__hero-img"
          />
          <span className="detail-media__hero-hint" aria-hidden="true">
            {m?.listings?.enlargeHint ?? "View larger"}
          </span>
        </button>
      </div>

      {showThumbs ? (
        <ul className="detail-media__thumbs" role="list">
          {images.map((url, i) => (
            <li key={`${url}-${i}`} className="detail-media__thumb-item">
              <button
                type="button"
                className={`detail-media__thumb${i === activeIndex ? " detail-media__thumb--active" : ""}`}
                onClick={() => setActiveIndex(i)}
                aria-label={`${viewPhotoLabel} ${i + 1}`}
                aria-current={i === activeIndex ? "true" : undefined}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <Lightbox
        open={lightboxOpen}
        close={closeLightbox}
        index={lightboxIndex}
        slides={slides}
        plugins={[Counter]}
        carousel={{ finite: true }}
        controller={{ closeOnBackdropClick: true }}
        animation={{ fade: 250 }}
        on={{ view: onView }}
      />
    </div>
  );
}
