export default function MarketingCta({ m }) {
  const c = m.cta;
  const adminBase = (process.env.NEXT_PUBLIC_ADMIN_APP_URL ?? "https://app.synthrstate.com").replace(/\/$/, "");
  return (
    <section id="contact" className="mk-section mk-cta" aria-labelledby="cta-heading">
      <div className="shell mk-cta__inner">
        <div className="mk-cta__copy">
          <h2 id="cta-heading" className="mk-cta__title">
            {c.title}
          </h2>
          <p className="mk-cta__lead">{c.lead}</p>
          <div className="mk-hero__actions" style={{ marginTop: "1rem" }}>
            <a href={`${adminBase}/login/`} className="mk-btn mk-btn--primary">
              {c.startFree}
            </a>
            <a href="/listings" className="mk-btn mk-btn--ghost">
              {c.viewDemo}
            </a>
          </div>
        </div>
        <div className="mk-cta__panel">
          <form className="mk-cta-form" action="#" method="post">
            <div className="mk-cta-form__row">
              <label className="mk-cta-form__label" htmlFor="cta-name">
                {c.name}
              </label>
              <input id="cta-name" className="mk-cta-form__input" name="name" type="text" autoComplete="name" required placeholder={c.placeholders.name} />
            </div>
            <div className="mk-cta-form__row">
              <label className="mk-cta-form__label" htmlFor="cta-email">
                {c.workEmail}
              </label>
              <input
                id="cta-email"
                className="mk-cta-form__input"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder={c.placeholders.email}
              />
            </div>
            <div className="mk-cta-form__row">
              <label className="mk-cta-form__label" htmlFor="cta-agency">
                {c.agencyName}
              </label>
              <input id="cta-agency" className="mk-cta-form__input" name="agency" type="text" placeholder={c.placeholders.agency} />
            </div>
            <div className="mk-cta-form__row">
              <label className="mk-cta-form__label" htmlFor="cta-note">
                {c.noteLabel}
              </label>
              <textarea id="cta-note" className="mk-cta-form__textarea" name="message" rows={4} placeholder={c.placeholders.note} />
            </div>
            <button type="submit" className="mk-btn mk-btn--primary mk-btn--block">
              {c.submit}
            </button>
            <p className="mk-cta-form__note">{c.formNote}</p>
          </form>
        </div>
      </div>
    </section>
  );
}
