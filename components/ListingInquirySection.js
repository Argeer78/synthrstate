"use client";

import { useMemo, useState } from "react";
import { createPublicInquiry } from "../lib/public-api";

/**
 * @param {{ listingTitle?: string; listingSlug: string; m: Record<string, any> }} props
 */
export default function ListingInquirySection({ listingTitle, listingSlug, m }) {
  const L = m.listings;
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle | sending | success | error
  const [message, setMessage] = useState("");

  const canSubmit = useMemo(() => {
    const nameOk = form.name.trim().length > 0;
    const hasEmailOrPhone = form.email.trim().length > 0 || form.phone.trim().length > 0;
    return nameOk && hasEmailOrPhone && status !== "sending";
  }, [form.email, form.name, form.phone, status]);

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
      });
      setStatus("success");
      setMessage(L.successMsg);
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : L.failMsg;
      setStatus("error");
      setMessage(msg);
    }
  }

  const opt = `(${L.optional})`;

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
            className={`state-block ${status === "error" ? "state-block--error" : ""}`}
            role={status === "error" ? "alert" : "status"}
            style={{ padding: "16px 18px", textAlign: "left", marginBottom: "16px" }}
          >
            <p className="state-block__title" style={{ marginBottom: 4 }}>
              {status === "success" ? L.statusSent : status === "error" ? L.statusError : L.statusGeneric}
            </p>
            <p style={{ margin: 0 }}>{message}</p>
          </div>
        ) : null}

        <form className="inquiry-form" onSubmit={onSubmit}>
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
            <button type="submit" className="inquiry-form__submit" disabled={!canSubmit}>
              {status === "sending" ? L.sending : L.sendInquiry}
            </button>
            <p className="inquiry-form__note" style={{ marginTop: 10 }}>
              {L.tip}
            </p>
          </fieldset>
        </form>
      </div>
    </section>
  );
}
