"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { readConsent } from "../lib/consent";

/** GA4 ID (default G-RJ417X6FEG from next.config env; override with NEXT_PUBLIC_GA_MEASUREMENT_ID). */
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/**
 * Google tag (gtag.js): loads async gtag/js and runs gtag('config', …) — only after cookie consent.
 * Same end result as Google’s inline snippet, without loading before Accept.
 */
export default function GoogleAnalyticsClient() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [consent, setConsent] = useState(/** @type {"accepted" | "rejected" | null} */ (null));
  const [scriptReady, setScriptReady] = useState(false);

  const refresh = useCallback(() => {
    setConsent(readConsent());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("synthr-consent-change", refresh);
    return () => window.removeEventListener("synthr-consent-change", refresh);
  }, [refresh]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.__synthrConsent = consent === "accepted" ? "accepted" : "rejected";
  }, [consent]);

  useEffect(() => {
    if (!GA_ID || consent !== "accepted" || !scriptReady || typeof window === "undefined") return;
    const gtag = window.gtag;
    if (typeof gtag !== "function") return;
    const qs = searchParams?.toString();
    const path = qs ? `${pathname}?${qs}` : pathname || "/";
    gtag("config", GA_ID, {
      page_path: path,
      anonymize_ip: true,
    });
  }, [pathname, searchParams, consent, scriptReady]);

  if (!GA_ID || consent !== "accepted") return null;

  return (
    <Script
      src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      strategy="afterInteractive"
      onLoad={() => setScriptReady(true)}
    />
  );
}
