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
      <body className="admin-body">{children}</body>
    </html>
  );
}
