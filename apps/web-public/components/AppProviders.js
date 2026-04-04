"use client";

import { Suspense } from "react";
import CookieBanner from "./CookieBanner";
import GoogleAnalyticsClient from "./GoogleAnalyticsClient";
import SentryInit from "./SentryInit";

export default function AppProviders({ children }) {
  return (
    <>
      {children}
      <CookieBanner />
      <Suspense fallback={null}>
        <GoogleAnalyticsClient />
      </Suspense>
      <SentryInit />
    </>
  );
}
