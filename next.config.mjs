/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // NEXT_PUBLIC_* is baked in at `next build` (not read from Hostinger PHP env at request time).
  // Override when building: NEXT_PUBLIC_API_URL=https://… npm run build
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "https://api.synthrstate.com",
  },
};

export default nextConfig;
