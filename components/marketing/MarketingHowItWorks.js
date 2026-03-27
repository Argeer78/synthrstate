export default function MarketingHowItWorks({ m }) {
  const { title, subtitle, steps } = m.howItWorks;
  return (
    <section id="how-it-works" className="mk-section" aria-labelledby="how-heading">
      <div className="shell">
        <h2 id="how-heading" className="mk-section__title">
          {title}
        </h2>
        <p className="mk-section__subtitle">{subtitle}</p>
        <ol className="mk-steps">
          {steps.map((s) => (
            <li key={s.step} className="mk-step">
              <span className="mk-step__num" aria-hidden>
                {s.step}
              </span>
              <div>
                <h3 className="mk-step__title">{s.title}</h3>
                <p className="mk-step__body">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
