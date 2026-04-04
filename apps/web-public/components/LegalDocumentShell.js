import Link from "next/link";
import { getRequestLocale } from "../lib/i18n.server";
import PublicSiteFooter from "./PublicSiteFooter";

export default async function LegalDocumentShell({ title, updated, children }) {
  const locale = await getRequestLocale();

  return (
    <>
      <div className="shell">
        <Link href="/" className="legal-back">
          ← Home
        </Link>
        <article className="legal-doc">
          <h1>{title}</h1>
          <p className="legal-updated">{updated}</p>
          {children}
        </article>
      </div>
      <PublicSiteFooter locale={locale} />
    </>
  );
}
