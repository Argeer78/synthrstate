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

export const metadata = {
  title: "Synthr — CRM and listing distribution for agencies",
  description:
    "Synthr is a real estate CRM and listing distribution platform for agencies that helps them manage leads, publish listings, and close deals faster.",
};

export default function MarketingHomePage() {
  const messages = getMergedMessages("en");
  return (
    <>
      <MarketingHeader />
      <main>
        <MarketingHero m={messages} />
        <MarketingFeatures />
        <MarketingProductPreview />
        <MarketingHowItWorks />
        <MarketingPricing />
        <MarketingSocialProof />
        <MarketingCta />
      </main>
      <MarketingFooter />
    </>
  );
}
