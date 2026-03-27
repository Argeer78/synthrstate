export default function MarketingFeatures({ m }) {
  const { title, subtitle, items } = m.features;
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
