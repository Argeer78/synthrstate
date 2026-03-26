import type { Metadata } from "next";
import "./globals.css";

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
      </head>
      <body className="admin-body">{children}</body>
    </html>
  );
}
