import "./globals.css";
import AppProviders from "../components/AppProviders";

function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "https://synthrstate.com";
  return raw.replace(/\/+$/, "");
}

/** @type {import("next").Metadata} */
export const metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Synthr — CRM and listing distribution for agencies",
    template: "%s | Synthr",
  },
  description: "Real estate CRM, listings publishing, and inquiry workflows for modern agencies.",
  openGraph: {
    type: "website",
    url: "/",
    title: "Synthr — CRM and listing distribution for agencies",
    description: "Real estate CRM, listings publishing, and inquiry workflows for modern agencies.",
    siteName: "Synthr",
  },
  twitter: {
    card: "summary_large_image",
    title: "Synthr — CRM and listing distribution for agencies",
    description: "Real estate CRM, listings publishing, and inquiry workflows for modern agencies.",
  },
  icons: {
    icon: "/favicon.svg",
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
