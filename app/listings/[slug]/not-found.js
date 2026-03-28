import Link from "next/link";
import PublicLanguageSwitcher from "../../../components/PublicLanguageSwitcher";
import PublicSiteFooter from "../../../components/PublicSiteFooter";
import { getMessages } from "../../../lib/i18n";
import { getRequestLocale } from "../../../lib/i18n.server";

export default async function ListingNotFound() {
  const locale = await getRequestLocale();
  const m = getMessages(locale);
  return (
    <div className="shell">
      <div className="listings-page__header-top listings-page__header-top--only-lang">
        <PublicLanguageSwitcher locale={locale} />
      </div>
      <div className="state-block">
        <p className="state-block__title">{m.listings.notFoundTitle}</p>
        <p style={{ margin: "0 0 16px" }}>{m.listings.notFoundBody}</p>
        <Link href="/listings">← {m.listings.backToDemo}</Link>
      </div>

      <PublicSiteFooter locale={locale} />
    </div>
  );
}
