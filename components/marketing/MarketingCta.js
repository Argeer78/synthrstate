export default function MarketingCta() {
  const adminBase = (process.env.NEXT_PUBLIC_ADMIN_APP_URL ?? "https://app.synthrstate.com").replace(/\/$/, "");
  return (
    <section id="contact" className="mk-section mk-cta" aria-labelledby="cta-heading">
      <div className="shell mk-cta__inner">
        <div className="mk-cta__copy">
          <h2 id="cta-heading" className="mk-cta__title">
            Ready to run your agency on one system?
          </h2>
          <p className="mk-cta__lead">
            Start free to test your real workflow: listings, inquiries, CRM follow-up, and team collaboration.
          </p>
          <div className="mk-hero__actions" style={{ marginTop: "1rem" }}>
            <a href={`${adminBase}/login/`} className="mk-btn mk-btn--primary">
              Start free
            </a>
            <a href="/listings" className="mk-btn mk-btn--ghost">
              View demo
            </a>
          </div>
        </div>
        <div className="mk-cta__panel">
          <form className="mk-cta-form" action="#" method="post">
            <div className="mk-cta-form__row">
              <label className="mk-cta-form__label" htmlFor="cta-name">
                Name
              </label>
              <input id="cta-name" className="mk-cta-form__input" name="name" type="text" autoComplete="name" required placeholder="Alex Papadopoulos" />
            </div>
            <div className="mk-cta-form__row">
              <label className="mk-cta-form__label" htmlFor="cta-email">
                Work email
              </label>
              <input
                id="cta-email"
                className="mk-cta-form__input"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@agency.gr"
              />
            </div>
            <div className="mk-cta-form__row">
              <label className="mk-cta-form__label" htmlFor="cta-agency">
                Agency name
              </label>
              <input id="cta-agency" className="mk-cta-form__input" name="agency" type="text" placeholder="Acropolis Realty" />
            </div>
            <div className="mk-cta-form__row">
              <label className="mk-cta-form__label" htmlFor="cta-note">
                What are you looking to solve?
              </label>
              <textarea
                id="cta-note"
                className="mk-cta-form__textarea"
                name="message"
                rows={4}
                placeholder="CRM migration, public site, portal feeds…"
              />
            </div>
            <button type="submit" className="mk-btn mk-btn--primary mk-btn--block">
              Request a walkthrough
            </button>
            <p className="mk-cta-form__note">
              This form is static for MVP. We can wire it to your CRM or email workflow next.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
