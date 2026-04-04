import "./globals.css";
import AppProviders from "../components/AppProviders";
import { getRequestLocale } from "../lib/i18n.server";

/** @type {import("next").Metadata} */
export const metadata = {
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export default async function RootLayout({ children }) {
  const locale = await getRequestLocale();
  return (
    <html lang={locale}>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
