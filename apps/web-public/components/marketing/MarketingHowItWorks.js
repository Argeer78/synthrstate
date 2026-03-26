const steps = [
  {
    step: "01",
    title: "Onboard your office",
    body: "Create your agency workspace, invite agents with roles, and connect your brand domain when you are ready.",
  },
  {
    step: "02",
    title: "Run deals in CRM",
    body: "Log leads, tasks, and viewings against contacts. Keep context where the next action is obvious.",
  },
  {
    step: "03",
    title: "Publish listings once",
    body: "List properties, attach media, and enqueue publication. Your site and feeds stay in sync from a single record.",
  },
];

export default function MarketingHowItWorks() {
  return (
    <section id="how-it-works" className="mk-section" aria-labelledby="how-heading">
      <div className="shell">
        <h2 id="how-heading" className="mk-section__title">
          How it works
        </h2>
        <p className="mk-section__subtitle">
          A straight path from first login to live listings — without custom integrations on day one.
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
