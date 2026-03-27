import "./globals.css";
import AppProviders from "../components/AppProviders";
import { getRequestLocale } from "../lib/i18n.server";

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
