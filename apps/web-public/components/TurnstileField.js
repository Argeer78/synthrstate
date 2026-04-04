"use client";

import Script from "next/script";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

/**
 * Cloudflare Turnstile. Requires `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
 * @param {{ siteKey?: string; onTokenChange: (token: string | null) => void; className?: string }} props
 */
const TurnstileField = forwardRef(function TurnstileField({ siteKey, onTokenChange, className }, ref) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [apiReady, setApiReady] = useState(false);

  const cleanup = useCallback(() => {
    if (widgetIdRef.current != null && typeof window !== "undefined" && window.turnstile) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
        /* ignore */
      }
      widgetIdRef.current = null;
    }
  }, []);

  const renderWidget = useCallback(() => {
    if (!siteKey || !containerRef.current || typeof window === "undefined" || !window.turnstile) return;
    cleanup();
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: (token) => onTokenChange(token),
      "expired-callback": () => onTokenChange(null),
      "error-callback": () => onTokenChange(null),
      theme: "auto",
      size: "flexible",
    });
  }, [siteKey, onTokenChange, cleanup]);

  useImperativeHandle(
    ref,
    () => ({
      reset: () => {
        if (widgetIdRef.current != null && typeof window !== "undefined" && window.turnstile) {
          try {
            window.turnstile.reset(widgetIdRef.current);
          } catch {
            /* ignore */
          }
        }
        onTokenChange(null);
      },
    }),
    [onTokenChange],
  );

  useEffect(() => {
    if (!siteKey || !apiReady) return;
    renderWidget();
    return cleanup;
  }, [siteKey, apiReady, renderWidget, cleanup]);

  if (!siteKey) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onLoad={() => setApiReady(true)}
      />
      <div className={className} ref={containerRef} data-turnstile-container />
    </>
  );
});

export default TurnstileField;
