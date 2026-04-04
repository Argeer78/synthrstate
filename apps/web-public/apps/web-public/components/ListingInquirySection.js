"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { createPublicInquiry } from "../lib/public-api";
import TurnstileField from "./TurnstileField";

/**
 * @param {{ listingTitle?: string; listingSlug: string; m: Record<string, any> }} props
 */
export default function ListingInquirySection({ listingTitle, listingSlug, m }) {
  const L = m?.listings ?? {
    inquiryTitle: "Inquire about this property",
    inquiryLeadInterested: "Interested in",
    inquiryLeadSuffix: "Leave your details and we'll get back to you.",
    inquiryLeadAlone: "Leave your details and we'll get back to you.",
    fullName: "Full name",
    email: "Email",
    phone: "Phone",
    message: "Message",
    optional: "optional",
    sendInquiry: "Send inquiry",
    sendInquiryDone: "Sent",
    sending: "Sending…",
    inquiryFormHint: "Please enter your name and either an email or phone number to send your inquiry.",
    tip: "Tip: add either an email or phone number so the agency can reach you.",
    placeholderName: "Your name",
    placeholderEmail: "you@example.com",
    placeholderPhone: "+30 …",
    placeholderMessage: "Tell us what you are looking for…",
    errName: "Please enter your full name.",
    errContact: "Please provide at least an email or phone number.",
    successMsg: "Thank you — your inquiry was sent. An agent will contact you soon.",
    failMsg: "Inquiry failed.",
    turnstileRequired: "Complete the security check below to send your inquiry.",
    turnstileVerifyFailed: "Security verification failed. Please try again.",
    statusSent: "Inquiry sent",
    statusError: "Could not send inquiry",
    statusGeneric: "Status",
    legendContact: "Contact form",
  };
  const siteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_INQUIRY_SITE_KEY || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [turnstileToken, setTurnstileToken] = useState(null);
  const turnstileRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | sending | success | error
  const [message, setMessage] = useState("");

  const onTurnstileToken = useCallback((token) => setTurnstileToken(token), []);

  const needsTurnstile = Boolean(siteKey);
  const turnstileOk = !needsTurnstile || Boolean(turnstileToken);

  const isFormValid = useMemo(() => {
    const nameOk = form.name.trim().length > 0;
    const hasEmailOrPhone = form.email.trim().length > 0 || form.phone.trim().length > 0;
    return nameOk && hasEmailOrPhone;
  }, [form.email, form.name, form.phone]);

  const isSubmitDisabled =
    !isFormValid || !turnstileOk || status === "sending" || status === "success";

  const canSend = isFormValid && turnstileOk;
  const submitVariant =
    status === "sending" ? "sending" : status === "success" ? "done" : canSend ? "ready" : "inactive";

  const showRequirementHint =
    !isFormValid && status !== "sending" && status !== "success" && L.inquiryFormHint;

  async function onSubmit(e) {
    e.preventDefault();
    setMessage("");

    if (!form.name.trim()) {
      setStatus("error");
      setMessage(L.errName);
      return;
    }
    if (!form.email.trim() && !form.phone.trim()) {
      setStatus("error");
      setMessage(L.errContact);
      return;
    }

    setStatus("sending");
    try {
      await createPublicInquiry(listingSlug, {
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        message: form.message.trim() || undefined,
        turnstileToken: turnstileToken || undefined,
      });
      setStatus("success");
      setMessage(L.successMsg);
      setForm({ name: "", email: "", phone: "", message: "" });
      turnstileRef.current?.reset();
    } catch (err) {
      const raw = err instanceof Error ? err.message : L.failMsg;
      const msg =
        /verification|security/i.test(raw) && L.turnstileVerifyFailed ? L.turnstileVerifyFailed : raw;
      setStatus("error");
      setMessage(msg);
      turnstileRef.current?.reset();
    }
  }

  const opt = `(${L.optional})`;

  const submitLabel =
    status === "sending" ? L.sending : status === "success" ? (L.sendInquiryDone ?? L.sendInquiry) : L.sendInquiry;

  return (
    <section className="inquiry-section" aria-labelledby="inquiry-heading">
      <div className="inquiry-section__inner">
        <h2 id="inquiry-heading" className="inquiry-section__title">
          {L.inquiryTitle}
        </h2>
        <p className="inquiry-section__lead">
          {listingTitle ? (
            <>
              {L.inquiryLeadInterested} <strong>{listingTitle}</strong>? {L.inquiryLeadSuffix}
            </>
          ) : (
            <>{L.inquiryLeadAlone}</>
          )}
        </p>

        {message ? (
          <div
            className={`inquiry-feedback ${status === "error" ? "inquiry-feedback--error" : "inquiry-feedback--success"}`}
            role={status === "error" ? "alert" : "status"}
            aria-live="polite"
          >
            <p className="inquiry-feedback__title">
              {status === "success" ? L.statusSent : status === "error" ? L.statusError : L.statusGeneric}
            </p>
            <p className="inquiry-feedback__body">{message}</p>
          </div>
        ) : null}

        <form className="inquiry-form" onSubmit={onSubmit} aria-busy={status === "sending"}>
          <fieldset className="inquiry-form__fieldset" disabled={status === "sending" || status === "success"}>
            <legend className="visually-hidden">{L.legendContact}</legend>
            <div className="inquiry-form__row">
              <label className="inquiry-form__label" htmlFor="inq-name">
                {L.fullName}
              </label>
              <input
                id="inq-name"
                className="inquiry-form__input"
                type="text"
                name="name"
                placeholder={L.placeholderName}
                autoComplete="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="inquiry-form__row">
              <label className="inquiry-form__label" htmlFor="inq-email">
                {L.email} <span className="inquiry-form__optional">{opt}</span>
              </label>
              <input
                id="inq-email"
                className="inquiry-form__input"
                type="email"
                name="email"
                placeholder={L.placeholderEmail}
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="inquiry-form__row">
              <label className="inquiry-form__label" htmlFor="inq-phone">
                {L.phone} <span className="inquiry-form__optional">{opt}</span>
              </label>
              <input
                id="inq-phone"
                className="inquiry-form__input"
                type="tel"
                name="phone"
                placeholder={L.placeholderPhone}
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="inquiry-form__row">
              <label className="inquiry-form__label" htmlFor="inq-message">
                {L.message} <span className="inquiry-form__optional">{opt}</span>
              </label>
              <textarea
                id="inq-message"
                className="inquiry-form__textarea"
                name="message"
                rows={4}
                placeholder={L.placeholderMessage}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>

            {siteKey ? (
              <div className="inquiry-form__turnstile-wrap">
                <TurnstileField
                  ref={turnstileRef}
                  siteKey={siteKey}
                  onTokenChange={onTurnstileToken}
                  className="inquiry-form__turnstile"
                />
                {needsTurnstile && !turnstileToken && isFormValid && status !== "success" ? (
                  <p className="inquiry-form__hint inquiry-form__hint--turnstile" id="inq-turnstile-hint">
                    {L.turnstileRequired}
                  </p>
                ) : null}
              </div>
            ) : null}

            {showRequirementHint ? (
              <p id="inq-submit-hint" className="inquiry-form__hint">
                {L.inquiryFormHint}
              </p>
            ) : null}

            <button
              type="submit"
              className={`inquiry-form__submit inquiry-form__submit--${submitVariant}`}
              disabled={isSubmitDisabled}
              aria-describedby={
                showRequirementHint
                  ? "inq-submit-hint"
                  : siteKey && !turnstileToken && isFormValid
                    ? "inq-turnstile-hint"
                    : undefined
              }
            >
              {submitLabel}
            </button>
            <p className="inquiry-form__note">{L.tip}</p>
          </fieldset>
        </form>
      </div>
    </section>
  );
}
