import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Monorepo: pin Turbopack to this app so the parent pnpm-lock is not treated as the workspace root.
  turbopack: {
    root: __dirname,
  },
  reactStrictMode: true,
  // Browsers/proxies that request /favicon.ico should get an existing static icon.
  async redirects() {
    return [
      { source: "/favicon.ico", destination: "/alphasynth-logo.png", permanent: false },
      { source: "/favicon.svg", destination: "/alphasynth-logo.png", permanent: false },
    ];
  },
  // NEXT_PUBLIC_* is baked in at `next build` (not read from Hostinger PHP env at request time).
  // Override when building: NEXT_PUBLIC_API_URL=https://… npm run build
  // Turnstile: must be set when you run `next build` or the inquiry widget stays hidden (no token → API 400).
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "https://api.synthrstate.com",
    NEXT_PUBLIC_SUPPORT_EMAIL:
      process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@synthrstate.com",
    // GA4 (gtag.js); loaded only after cookie consent when using GoogleAnalyticsLoader.
    NEXT_PUBLIC_GA_MEASUREMENT_ID:
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-RJ417X6FEG",
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "https://synthrstate.com",
    NEXT_PUBLIC_TURNSTILE_INQUIRY_SITE_KEY:
      process.env.NEXT_PUBLIC_TURNSTILE_INQUIRY_SITE_KEY || "",
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "",
  },
};

export default nextConfig;
