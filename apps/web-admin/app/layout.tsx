import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider";
import { I18nProvider } from "./components/I18nProvider";
import { SUPPORTED_LANGUAGES } from "../lib/supported-languages";

export const metadata: Metadata = {
  title: "Synthr Admin",
  description: "CRM, listings, and publishing for real estate agencies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <script
          // Set theme before paint to minimize flash.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='synthr_admin_theme';var m=localStorage.getItem(k)||'system';var d=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;var r=(m==='system')?(d?'dark':'light'):(m==='dark'?'dark':'light');document.documentElement.dataset.theme=r;var l=localStorage.getItem('synthr_admin_lang')||'en';var ok=${JSON.stringify([...SUPPORTED_LANGUAGES])};document.documentElement.lang=(ok.indexOf(l)>=0?l:'en');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="admin-body">
        <I18nProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
