"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readConsent, writeConsent } from "../lib/consent";

export default function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(readConsent() === null);
  }, []);

  if (!open) return null;

  function accept() {
    writeConsent("accepted");
    setOpen(false);
  }

  function reject() {
    writeConsent("rejected");
    setOpen(false);
  }

  return (
    <div className="cookie-banner" role="dialog" aria-labelledby="cookie-banner-title" aria-live="polite">
      <div className="cookie-banner__inner">
        <p id="cookie-banner-title" className="cookie-banner__title">
          Cookies & analytics
        </p>
        <p className="cookie-banner__text">
          We use optional cookies for analytics to understand how visitors use our site. We do not load analytics until you
          choose. Read our{" "}
          <Link href="/cookies/" className="cookie-banner__link">
            Cookie Policy
          </Link>{" "}
          and{" "}
          <Link href="/privacy/" className="cookie-banner__link">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="cookie-banner__actions">
          <button type="button" className="cookie-banner__btn cookie-banner__btn--primary" onClick={accept}>
            Accept
          </button>
          <button type="button" className="cookie-banner__btn" onClick={reject}>
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
