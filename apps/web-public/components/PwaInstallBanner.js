"use client";

import { useEffect, useMemo, useState } from "react";

const DISMISS_KEY = "synthr_pwa_banner_dismissed";

function isStandalone() {
  if (typeof window === "undefined") return false;
  const inDisplayMode = window.matchMedia?.("(display-mode: standalone)")?.matches;
  const iOSStandalone = window.navigator?.standalone === true;
  return Boolean(inDisplayMode || iOSStandalone);
}

export default function PwaInstallBanner() {
  const [eventRef, setEventRef] = useState(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(DISMISS_KEY);
    setDismissed(stored === "1");

    if (isStandalone()) {
      setDismissed(true);
      return;
    }

    function onBeforeInstallPrompt(event) {
      event.preventDefault();
      setEventRef(event);
    }

    function onInstalled() {
      setDismissed(true);
      setEventRef(null);
      window.localStorage.setItem(DISMISS_KEY, "1");
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const open = useMemo(() => !dismissed && Boolean(eventRef), [dismissed, eventRef]);

  if (!open) return null;

  async function install() {
    if (!eventRef) return;
    await eventRef.prompt();
    await eventRef.userChoice;
    setEventRef(null);
  }

  function close() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISS_KEY, "1");
    }
    setDismissed(true);
  }

  return (
    <div className="pwa-banner" role="dialog" aria-labelledby="pwa-banner-title" aria-live="polite">
      <div className="pwa-banner__inner">
        <p id="pwa-banner-title" className="pwa-banner__title">
          Install Synthr app
        </p>
        <p className="pwa-banner__text">Add Synthr to your home screen for a faster, app-like experience.</p>
        <div className="pwa-banner__actions">
          <button type="button" className="pwa-banner__btn pwa-banner__btn--primary" onClick={install}>
            Install
          </button>
          <button type="button" className="pwa-banner__btn" onClick={close}>
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}