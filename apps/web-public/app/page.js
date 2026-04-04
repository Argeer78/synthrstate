import MarketingCta from "../components/marketing/MarketingCta";
import MarketingFeatures from "../components/marketing/MarketingFeatures";
import MarketingFooter from "../components/marketing/MarketingFooter";
import MarketingHeader from "../components/marketing/MarketingHeader";
import MarketingHero from "../components/marketing/MarketingHero";
import MarketingHowItWorks from "../components/marketing/MarketingHowItWorks";
import MarketingPricing from "../components/marketing/MarketingPricing";
import MarketingProductPreview from "../components/marketing/MarketingProductPreview";
import MarketingSocialProof from "../components/marketing/MarketingSocialProof";
import { getMergedMessages } from "../lib/messages";
import { getRequestLocale } from "../lib/i18n.server";

export const metadata = {
  title: "Synthr — CRM and listing distribution for agencies",
  description:
    "Synthr is a real estate CRM and listing distribution platform for agencies that helps them manage leads, publish listings, and close deals faster.",
};

export default async function MarketingHomePage() {
  const locale = await getRequestLocale();
  const messages = getMergedMessages(locale);
  return (
    <>
      <MarketingHeader m={messages} locale={locale} />
      <main>
        <MarketingHero m={messages} />
        <MarketingFeatures m={messages} />
        <MarketingProductPreview m={messages} />
        <MarketingHowItWorks m={messages} />
        <MarketingPricing m={messages} />
        <MarketingSocialProof m={messages} />
        <MarketingCta m={messages} />
      </main>
      <MarketingFooter m={messages} />
    </>
  );
}
