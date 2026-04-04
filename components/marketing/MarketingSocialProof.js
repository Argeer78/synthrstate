export default function MarketingSocialProof({ m }) {
  const s = m?.socialProof ?? {};
  const title = s.title ?? "Built for modern real estate agencies";
  const supporting = s.supporting ?? "Bring listings, contacts, and follow-up together so your team stays productive and organized.";
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
