export default function MarketingCta() {
  return (
    <section id="contact" className="mk-section mk-cta" aria-labelledby="cta-heading">
      <div className="shell mk-cta__inner">
        <div className="mk-cta__copy">
          <h2 id="cta-heading" className="mk-cta__title">
            Ready to modernize your agency stack?
          </h2>
          <p className="mk-cta__lead">
            Tell us about your offices and channels. We will follow up with access options and an onboarding
            timeline.
          </p>
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
              Send message
            </button>
            <p className="mk-cta-form__note">
              This form is static on the marketing site — wire it to your CRM or email service when you are ready.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
