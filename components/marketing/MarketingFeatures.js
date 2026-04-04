export default function MarketingFeatures({ m }) {
  const s = m?.features ?? {};
  const title = s.title ?? "Why agencies choose Synthr";
  const subtitle = s.subtitle ?? "Real outcomes for real estate teams: faster execution, cleaner data, and better conversion from inquiry to deal.";
  const items = Array.isArray(s.items)
    ? s.items
    : [
        { title: "Manage leads and listings in one place", body: "Run CRM and inventory from one workspace." },
        { title: "Publish listings everywhere", body: "Push listings to your website and channels with clear status." },
        { title: "Never miss an inquiry", body: "Capture inquiries and convert them to actionable leads." },
      ];
  return (
    <section id="features" className="mk-section mk-section--alt" aria-labelledby="features-heading">
      <div className="shell">
        <h2 id="features-heading" className="mk-section__title">
          {title}
        </h2>
        <p className="mk-section__subtitle">{subtitle}</p>
        <ul className="mk-feature-grid">
          {items.map((f) => (
            <li key={f.title} className="mk-feature-card">
              <h3 className="mk-feature-card__title">{f.title}</h3>
              <p className="mk-feature-card__body">{f.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
