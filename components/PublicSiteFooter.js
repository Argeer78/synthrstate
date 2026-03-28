import Link from "next/link";
import PublicLanguageSwitcher from "./PublicLanguageSwitcher";

const SUPPORT = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@synthrstate.com";

export default function PublicSiteFooter({ locale = "en" }) {
  return (
    <footer className="public-site-footer">
      <div className="public-site-footer__inner">
        <PublicLanguageSwitcher locale={locale} className="public-site-footer__lang" />
        <ul className="public-site-footer__links">
          <li>
            <Link href="/terms/">Terms of Service</Link>
          </li>
          <li>
            <Link href="/privacy/">Privacy Policy</Link>
          </li>
          <li>
            <Link href="/cookies/">Cookie Policy</Link>
          </li>
          <li>
            <a href={`mailto:${SUPPORT}`}>Support: {SUPPORT}</a>
          </li>
        </ul>
        <span>© {new Date().getFullYear()} Synthr</span>
      </div>
    </footer>
  );
}
