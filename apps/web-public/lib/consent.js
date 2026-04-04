/** Cookie / analytics consent (non-essential). Stored in localStorage only. */
export const CONSENT_STORAGE_KEY = "synthr_cookie_consent";

/** @typedef {"accepted" | "rejected" | null} ConsentState */

/**
 * @returns {ConsentState}
 */
export function readConsent() {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (v === "accepted" || v === "rejected") return v;
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * @param {"accepted" | "rejected"} value
 */
export function writeConsent(value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
    window.dispatchEvent(new Event("synthr-consent-change"));
  } catch {
    /* ignore */
  }
}
