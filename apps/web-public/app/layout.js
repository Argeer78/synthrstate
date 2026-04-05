import "./globals.css";
import AppProviders from "../components/AppProviders";

/** @type {import("next").Metadata} */
export const metadata = {
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/alphasynth-logo.png", type: "image/png" }],
  },
};

/** @type {import("next").Viewport} */
export const viewport = {
  themeColor: "#2563eb",
};

export default async function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
