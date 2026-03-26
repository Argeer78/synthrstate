/**
 * Placeholder for POST /public/demo-agency/listings/:slug/inquiries (future).
 * @param {{ listingTitle?: string }} props
 */
export default function ListingInquirySection({ listingTitle }) {
  return (
    <section className="inquiry-section" aria-labelledby="inquiry-heading">
      <div className="inquiry-section__inner">
        <h2 id="inquiry-heading" className="inquiry-section__title">
          Inquire about this property
        </h2>
        <p className="inquiry-section__lead">
          {listingTitle ? (
            <>
              Interested in <strong>{listingTitle}</strong>? Leave your details and we will contact you
              when online inquiries are enabled.
            </>
          ) : (
            <>Leave your details and we will contact you when online inquiries are enabled.</>
          )}
        </p>

        <form className="inquiry-form" aria-disabled="true">
          <fieldset disabled className="inquiry-form__fieldset">
            <legend className="visually-hidden">Contact form (preview)</legend>
            <div className="inquiry-form__row">
              <label className="inquiry-form__label" htmlFor="inq-name">
                Full name
              </label>
              <input
                id="inq-name"
                className="inquiry-form__input"
                type="text"
                name="name"
                placeholder="Your name"
                autoComplete="name"
              />
            </div>
            <div className="inquiry-form__row">
              <label className="inquiry-form__label" htmlFor="inq-email">
                Email
              </label>
              <input
                id="inq-email"
                className="inquiry-form__input"
                type="email"
                name="email"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div className="inquiry-form__row">
              <label className="inquiry-form__label" htmlFor="inq-phone">
                Phone <span className="inquiry-form__optional">(optional)</span>
              </label>
              <input
                id="inq-phone"
                className="inquiry-form__input"
                type="tel"
                name="phone"
                placeholder="+30 …"
                autoComplete="tel"
              />
            </div>
            <div className="inquiry-form__row">
              <label className="inquiry-form__label" htmlFor="inq-message">
                Message
              </label>
              <textarea
                id="inq-message"
                className="inquiry-form__textarea"
                name="message"
                rows={4}
                placeholder="Tell us what you are looking for…"
              />
            </div>
            <button type="button" className="inquiry-form__submit" disabled>
              Send inquiry
            </button>
          </fieldset>
        </form>

        <p className="inquiry-form__note">
          This form is a preview only. Submissions are not sent yet — wiring to the Synthr API will be
          added next.
        </p>
      </div>
    </section>
  );
}
