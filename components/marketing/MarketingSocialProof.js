export default function MarketingSocialProof({ m }) {
  const { title, subtitle, items } = m.socialProof;
  return (
    <section id="social-proof" className="mk-section mk-section--alt" aria-labelledby="social-proof-heading">
      <div className="shell">
        <h2 id="social-proof-heading" className="mk-section__title">
          {title}
        </h2>
        <p className="mk-section__subtitle">{subtitle}</p>
        <ul className="mk-feature-grid">
          {items.map((item) => (
            <li key={item.author} className="mk-feature-card">
              <p className="mk-feature-card__body">&ldquo;{item.quote}&rdquo;</p>
              <p className="mk-feature-card__title" style={{ marginTop: "0.75rem" }}>
                {item.author}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
