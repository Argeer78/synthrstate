const features = [
  {
    title: "Agency CRM",
    body: "Contacts, leads, tasks, and notes scoped per office — so your team stays aligned without spreadsheet chaos.",
  },
  {
    title: "Property & listings",
    body: "One source of truth for inventory: draft, publish, and archive sale and rental listings with media and internal notes.",
  },
  {
    title: "Distribution engine",
    body: "Queue-based publishing to your public site and exports — built to add portal adapters when you are ready.",
  },
  {
    title: "AI-assisted workflows",
    body: "Generate descriptions, summarize leads, and match buyers to listings — always with human review.",
  },
];

export default function MarketingFeatures() {
  return (
    <section id="features" className="mk-section mk-section--alt" aria-labelledby="features-heading">
      <div className="shell">
        <h2 id="features-heading" className="mk-section__title">
          Everything in one platform
        </h2>
        <p className="mk-section__subtitle">
          Replace fragmented tools with a single tenant-aware stack designed for residential agencies.
        </p>
        <ul className="mk-feature-grid">
          {features.map((f) => (
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
