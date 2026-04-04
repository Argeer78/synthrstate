"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, any>) => string;
      remove: (widgetId: string) => void;
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadTurnstileApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const url = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      const existing = document.querySelector(`script[src="${url}"]`) as HTMLScriptElement | null;
      if (existing) {
        if (window.turnstile) {
          resolve();
          return;
        }
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("Turnstile script error")));
        return;
      }
      const s = document.createElement("script");
      s.src = url;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Turnstile script error"));
      document.body.appendChild(s);
    });
  }
  return scriptPromise;
}

export function TurnstileField(props: {
  siteKey: string;
  onToken: (token: string) => void;
  onExpire?: () => void;
  theme?: "light" | "dark" | "auto";
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(props.onToken);
  const onExpireRef = useRef(props.onExpire);
  onTokenRef.current = props.onToken;
  onExpireRef.current = props.onExpire;

  useEffect(() => {
    if (!props.siteKey) return;
    let cancelled = false;

    (async () => {
      try {
        await loadTurnstileApi();
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: props.siteKey,
          theme: props.theme ?? "auto",
          callback: (token: string) => onTokenRef.current(token),
          "expired-callback": () => onExpireRef.current?.(),
        });
      } catch {
        onExpireRef.current?.();
      }
    })();

    return () => {
      cancelled = true;
      const id = widgetIdRef.current;
      widgetIdRef.current = null;
      if (id && window.turnstile) {
        try {
          window.turnstile.remove(id);
        } catch {
          // ignore
        }
      }
    };
  }, [props.siteKey, props.theme]);

  return <div ref={containerRef} className="turnstile-field" />;
}

