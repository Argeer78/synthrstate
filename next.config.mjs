/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Browsers/proxies that request /favicon.ico (SVG is at /favicon.svg + metadata.icons).
  async redirects() {
    return [{ source: "/favicon.ico", destination: "/favicon.svg", permanent: false }];
  },
  // NEXT_PUBLIC_* is baked in at `next build` (not read from Hostinger PHP env at request time).
  // Override when building: NEXT_PUBLIC_API_URL=https://… npm run build
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "https://api.synthrstate.com",
    NEXT_PUBLIC_SUPPORT_EMAIL:
      process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@synthrstate.com",
    // GA4 (gtag.js); equivalent to Google’s snippet — loaded only after cookie consent (see GoogleAnalyticsClient.js).
    NEXT_PUBLIC_GA_MEASUREMENT_ID:
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-RJ417X6FEG",
  },
};

export default nextConfig;
