export default function MarketingSocialProof({ m }) {
  const { title, supporting } = m.socialProof;
  return (
    <section id="trust" className="mk-section mk-section--alt mk-trust" aria-labelledby="trust-heading">
      <div className="shell">
        <h2 id="trust-heading" className="mk-section__title">
          {title}
        </h2>
        <p className="mk-trust__supporting">{supporting}</p>
      </div>
    </section>
  );
}
