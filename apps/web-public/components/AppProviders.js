"use client";

import { Suspense } from "react";
import GoogleAnalyticsClient from "./GoogleAnalyticsClient";
import CookieBanner from "./CookieBanner";

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
