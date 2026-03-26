/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Required for Hostinger File Manager–only hosting (static files, no Node).
  output: "export",
  images: { unoptimized: true },
  // Hostinger static hosting may return 403 for directory routes without index.html.
  // With `trailingSlash: true`, Next exports `/login/` as `out/login/index.html`.
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "https://api.synthrstate.com",
  },
};

export default nextConfig;
