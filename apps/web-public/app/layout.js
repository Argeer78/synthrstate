import "./globals.css";
import AppProviders from "../components/AppProviders";

/** @type {import("next").Metadata} */
export const metadata = {
  icons: {
    icon: [{ url: "/alphasynth-logo.png", type: "image/png" }],
  },
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
