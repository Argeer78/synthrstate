"use client";

import { Suspense } from "react";
import CookieBanner from "./CookieBanner";
import GoogleAnalyticsClient from "./GoogleAnalyticsClient";

export default function AppProviders({ children }) {
  return (
    <>
      {children}
      <CookieBanner />
      <Suspense fallback={null}>
        <GoogleAnalyticsClient />
      </Suspense>
    </>
  );
}
