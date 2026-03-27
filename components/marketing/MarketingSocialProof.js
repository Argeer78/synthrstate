const testimonials = [
  {
    quote:
      "Synthr gave our office one clear workflow from listing publication to lead follow-up. We stopped losing inquiries between tools.",
    author: "Agency Director, Athens",
  },
  {
    quote:
      "The CRM + listing flow is practical for daily work. Agents update once and the team sees the same truth instantly.",
    author: "Sales Manager, Thessaloniki",
  },
  {
    quote:
      "Publication logs and feed visibility helped us troubleshoot faster and keep listings accurate across channels.",
    author: "Operations Lead, Regional Network",
  },
];

export default function MarketingSocialProof() {
  return (
    <section id="social-proof" className="mk-section mk-section--alt" aria-labelledby="social-proof-heading">
      <div className="shell">
        <h2 id="social-proof-heading" className="mk-section__title">
          Trusted by modern real estate teams
        </h2>
        <p className="mk-section__subtitle">
          Social proof placeholder for MVP. Replace with customer logos, names, and measurable outcomes as you onboard
          agencies.
        </p>
        <ul className="mk-feature-grid">
          {testimonials.map((item) => (
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
