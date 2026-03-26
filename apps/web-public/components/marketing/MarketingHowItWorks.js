const steps = [
  {
    step: "01",
    title: "Add your listing",
    body: "Create a property and listing record once, with all the details your team needs.",
  },
  {
    step: "02",
    title: "Publish everywhere",
    body: "Push listings to website and feed channels with clear publication status and logs.",
  },
  {
    step: "03",
    title: "Capture inquiries",
    body: "Receive public inquiries into CRM so no lead gets lost in inboxes or spreadsheets.",
  },
  {
    step: "04",
    title: "Convert to leads",
    body: "Turn qualified inquiries into structured leads and contacts in one click.",
  },
  {
    step: "05",
    title: "Close deals",
    body: "Use tasks, notes, summaries, and team workflow to move opportunities to won.",
  },
];

export default function MarketingHowItWorks() {
  return (
    <section id="how-it-works" className="mk-section" aria-labelledby="how-heading">
      <div className="shell">
        <h2 id="how-heading" className="mk-section__title">
          How Synthr works
        </h2>
        <p className="mk-section__subtitle">
          A practical workflow from listing creation to closed deals.
        </p>
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
