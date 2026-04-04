"use client";

import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, LOCALE_LABELS, SUPPORTED_LOCALES, normalizeLocale } from "../lib/i18n";

/**
 * Sets `synthr_locale` and refreshes RSC so server components re-render in the chosen language.
 */
export default function PublicLanguageSwitcher({ locale, className = "" }) {
  const router = useRouter();
  const value = normalizeLocale(locale);

  function onChange(e) {
    const next = normalizeLocale(e.target.value);
    document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=${LOCALE_COOKIE_MAX_AGE};SameSite=Lax`;
    router.refresh();
  }

  return (
    <label className={`public-lang-switch ${className}`.trim()}>
      <span className="public-lang-switch__sr">Language</span>
      <select className="public-lang-switch__select" value={value} onChange={onChange}>
        {SUPPORTED_LOCALES.map((code) => (
          <option key={code} value={code}>
            {LOCALE_LABELS[code] ?? code}
          </option>
        ))}
      </select>
    </label>
  );
}
