"use client";

import { Suspense } from "react";
import GoogleAnalyticsClient from "./GoogleAnalyticsClient";

export default function AppProviders({ children }) {
  return (
    <>
      {children}
      <Suspense fallback={null}>
        <GoogleAnalyticsClient />
      </Suspense>
    </>
  );
}
