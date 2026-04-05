"use client";

import { Suspense } from "react";
import CookieBanner from "./CookieBanner";
import GoogleAnalyticsClient from "./GoogleAnalyticsClient";
import PwaInstallBanner from "./PwaInstallBanner";
import PwaRegister from "./PwaRegister";

export default function AppProviders({ children }) {
  return (
    <>
      {children}
      <PwaRegister />
      <CookieBanner />
      <PwaInstallBanner />
      <Suspense fallback={null}>
        <GoogleAnalyticsClient />
      </Suspense>
    </>
  );
}
