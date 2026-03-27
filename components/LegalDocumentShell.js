import Link from "next/link";
import PublicSiteFooter from "./PublicSiteFooter";

export default function LegalDocumentShell({ title, updated, children }) {
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
      <PublicSiteFooter />
    </>
  );
}
