import Link from "next/link";

export default function MarketingProductPreview() {
  return (
    <section id="product" className="mk-section" aria-labelledby="preview-heading">
      <div className="shell">
        <h2 id="preview-heading" className="mk-section__title">
          Built for daily agency operations
        </h2>
        <p className="mk-section__subtitle">
          Synthr combines CRM, listing operations, distribution, AI tools, and team workflow so your office can run
          from one source of truth.
        </p>
        <div className="mk-feature-grid" style={{ marginBottom: "1.5rem" }}>
          <div className="mk-feature-card">
            <h3 className="mk-feature-card__title">CRM</h3>
            <p className="mk-feature-card__body">Track contacts, leads, tasks, notes, and inquiry conversion in one pipeline.</p>
          </div>
          <div className="mk-feature-card">
            <h3 className="mk-feature-card__title">Listings</h3>
            <p className="mk-feature-card__body">Create, edit, enrich with media, and manage listing status with clear ownership.</p>
          </div>
          <div className="mk-feature-card">
            <h3 className="mk-feature-card__title">Distribution</h3>
            <p className="mk-feature-card__body">Publish to website/channels with publication logs and XML feed support.</p>
          </div>
          <div className="mk-feature-card">
            <h3 className="mk-feature-card__title">AI tools</h3>
            <p className="mk-feature-card__body">Generate descriptions and summaries to save hours while keeping human review.</p>
          </div>
          <div className="mk-feature-card">
            <h3 className="mk-feature-card__title">Team workflow</h3>
            <p className="mk-feature-card__body">Role-based collaboration, assignment, and notifications keep everyone aligned.</p>
          </div>
        </div>
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
            Illustrative UI. See public listing output in our <Link href="/listings">demo listings</Link> page.
          </p>
        </div>
      </div>
    </section>
  );
}
