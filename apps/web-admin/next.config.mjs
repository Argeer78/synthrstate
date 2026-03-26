/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Required for Hostinger File Manager–only hosting (static files, no Node).
  output: "export",
  images: { unoptimized: true },
  trailingSlash: false,
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "https://api.synthrstate.com",
  },
};

export default nextConfig;
