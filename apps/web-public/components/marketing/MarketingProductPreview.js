import Link from "next/link";

export default function MarketingProductPreview({ m }) {
  const p = m?.product ?? {};
  const title = p.title ?? "Built for daily agency operations";
  const subtitle = p.subtitle ?? "CRM, listings, distribution, AI tools, and team workflow in one place.";
  const cards = Array.isArray(p.cards)
    ? p.cards
    : [
        { title: "CRM", body: "Track contacts, leads, tasks, and notes." },
        { title: "Listings", body: "Create and manage listings with media." },
        { title: "Distribution", body: "Publish to website and channels." },
      ];
  const preview = p.preview ?? {
    urlLine: "app.synthrstate.com · Listings",
    navAll: "All listings",
    navDraft: "Draft",
    navActive: "Active",
    navPublications: "Publications",
    pillActive: "12 active",
    pillQueued: "3 queued",
    badgeActive: "Active",
    captionBefore: "Illustrative UI. See public listing output in our",
    captionLink: "demo listings",
    captionAfter: "page.",
  };
  return (
    <section id="product" className="mk-section" aria-labelledby="preview-heading">
      <div className="shell">
        <h2 id="preview-heading" className="mk-section__title">
          {title}
        </h2>
        <p className="mk-section__subtitle">{subtitle}</p>
        <div className="mk-feature-grid" style={{ marginBottom: "1.5rem" }}>
          {cards.map((c) => (
            <div key={c.title} className="mk-feature-card">
              <h3 className="mk-feature-card__title">{c.title}</h3>
              <p className="mk-feature-card__body">{c.body}</p>
            </div>
          ))}
        </div>
        <div className="mk-preview">
          <div className="mk-preview__chrome" aria-hidden>
            <span className="mk-preview__dot" />
            <span className="mk-preview__dot" />
            <span className="mk-preview__dot" />
            <span className="mk-preview__url">{preview.urlLine}</span>
          </div>
          <div className="mk-preview__body">
            <div className="mk-preview__sidebar">
              <div className="mk-preview__nav-item mk-preview__nav-item--active">{preview.navAll}</div>
              <div className="mk-preview__nav-item">{preview.navDraft}</div>
              <div className="mk-preview__nav-item">{preview.navActive}</div>
              <div className="mk-preview__nav-item">{preview.navPublications}</div>
            </div>
            <div className="mk-preview__main">
              <div className="mk-preview__toolbar">
                <span className="mk-preview__pill">{preview.pillActive}</span>
                <span className="mk-preview__pill mk-preview__pill--muted">{preview.pillQueued}</span>
              </div>
              <div className="mk-preview__rows">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="mk-preview__row">
                    <div className="mk-preview__thumb" />
                    <div className="mk-preview__row-text">
                      <div className="mk-preview__line mk-preview__line--title" />
                      <div className="mk-preview__line mk-preview__line--meta" />
                    </div>
                    <span className="mk-preview__badge">{preview.badgeActive}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="mk-preview__caption">
            {preview.captionBefore}{" "}
            <Link href="/listings">{preview.captionLink}</Link> {preview.captionAfter}
          </p>
        </div>
      </div>
    </section>
  );
}
