import Link from "next/link";

export default function MarketingProductPreview() {
  return (
    <section className="mk-section" aria-labelledby="preview-heading">
      <div className="shell">
        <h2 id="preview-heading" className="mk-section__title">
          Listings, managed end-to-end
        </h2>
        <p className="mk-section__subtitle">
          Capture the property once, enrich with photos and copy, then push to your branded site — with status,
          logs, and retries handled by the worker, not your sales team.
        </p>
        <div className="mk-preview">
          <div className="mk-preview__chrome" aria-hidden>
            <span className="mk-preview__dot" />
            <span className="mk-preview__dot" />
            <span className="mk-preview__dot" />
            <span className="mk-preview__url">app.synthrstate.com · Listings</span>
          </div>
          <div className="mk-preview__body">
            <div className="mk-preview__sidebar">
              <div className="mk-preview__nav-item mk-preview__nav-item--active">All listings</div>
              <div className="mk-preview__nav-item">Draft</div>
              <div className="mk-preview__nav-item">Active</div>
              <div className="mk-preview__nav-item">Publications</div>
            </div>
            <div className="mk-preview__main">
              <div className="mk-preview__toolbar">
                <span className="mk-preview__pill">12 active</span>
                <span className="mk-preview__pill mk-preview__pill--muted">3 queued</span>
              </div>
              <div className="mk-preview__rows">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="mk-preview__row">
                    <div className="mk-preview__thumb" />
                    <div className="mk-preview__row-text">
                      <div className="mk-preview__line mk-preview__line--title" />
                      <div className="mk-preview__line mk-preview__line--meta" />
                    </div>
                    <span className="mk-preview__badge">Active</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="mk-preview__caption">
            Illustrative UI — explore a live sample feed on our{" "}
            <Link href="/listings">demo listings</Link> page.
          </p>
        </div>
      </div>
    </section>
  );
}
