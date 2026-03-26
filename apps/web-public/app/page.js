import MarketingCta from "../components/marketing/MarketingCta";
import MarketingFeatures from "../components/marketing/MarketingFeatures";
import MarketingFooter from "../components/marketing/MarketingFooter";
import MarketingHeader from "../components/marketing/MarketingHeader";
import MarketingHero from "../components/marketing/MarketingHero";
import MarketingHowItWorks from "../components/marketing/MarketingHowItWorks";
import MarketingPricing from "../components/marketing/MarketingPricing";
import MarketingProductPreview from "../components/marketing/MarketingProductPreview";

export const metadata = {
  title: "Synthr — Real estate CRM & listing distribution",
  description:
    "Synthr is a multi-tenant CRM and listing distribution platform built for real estate agencies — one source of truth for inventory, CRM, and publishing.",
};

export default function MarketingHomePage() {
  return (
    <>
      <MarketingHeader />
      <main>
        <MarketingHero />
        <MarketingFeatures />
        <MarketingProductPreview />
        <MarketingHowItWorks />
        <MarketingPricing />
        <MarketingCta />
      </main>
      <MarketingFooter />
    </>
  );
}
