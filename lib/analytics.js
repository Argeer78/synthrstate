/**
 * GA4 event helper (client-only). Requires GoogleAnalyticsClient to have loaded gtag after consent.
 * @param {string} eventName
 * @param {Record<string, unknown>} [params]
 */
export function trackEvent(eventName, params) {
  if (typeof window === "undefined") return;
  if (window.__synthrConsent !== "accepted") return;
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!id || typeof window.gtag !== "function") return;
  window.gtag("event", eventName, params ?? {});
}
