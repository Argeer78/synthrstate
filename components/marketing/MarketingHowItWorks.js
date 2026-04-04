export default function MarketingHowItWorks({ m }) {
  const s = m?.howItWorks ?? {};
  const title = s.title ?? "How Synthr works";
  const subtitle = s.subtitle ?? "A practical workflow from listing creation to closed deals.";
  const steps = Array.isArray(s.steps)
    ? s.steps
    : [
        { step: "01", title: "Add your listing", body: "Create property and listing details once." },
        { step: "02", title: "Publish everywhere", body: "Push listings to site and channels." },
        { step: "03", title: "Capture inquiries", body: "Convert inquiries into leads quickly." },
      ];
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
