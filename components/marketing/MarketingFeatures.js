const features = [
  {
    title: "Manage leads and listings in one place",
    body: "Run CRM and inventory from one workspace. No more switching between disconnected tools.",
  },
  {
    title: "Publish listings everywhere",
    body: "Push listings to your website and feed channels with clear status, logs, and retries.",
  },
  {
    title: "Never miss an inquiry",
    body: "Capture public inquiries, route them into CRM, and convert them to actionable leads fast.",
  },
  {
    title: "Use AI where it saves time",
    body: "Generate listing descriptions, summarize lead context, and draft better responses with review control.",
  },
  {
    title: "Work as a team",
    body: "Assign leads, manage tasks, add notes, and collaborate with clear role-based access.",
  },
];

export default function MarketingFeatures() {
  return (
    <section id="features" className="mk-section mk-section--alt" aria-labelledby="features-heading">
      <div className="shell">
        <h2 id="features-heading" className="mk-section__title">
          Why agencies choose Synthr
        </h2>
        <p className="mk-section__subtitle">
          Real outcomes for real estate teams: faster execution, cleaner data, and better conversion from inquiry to deal.
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
