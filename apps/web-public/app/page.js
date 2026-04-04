import MarketingCta from "../components/marketing/MarketingCta";
import MarketingFeatures from "../components/marketing/MarketingFeatures";
import MarketingFooter from "../components/marketing/MarketingFooter";
import MarketingHeader from "../components/marketing/MarketingHeader";
import MarketingHero from "../components/marketing/MarketingHero";
import MarketingHowItWorks from "../components/marketing/MarketingHowItWorks";
import MarketingPricing from "../components/marketing/MarketingPricing";
import MarketingProductPreview from "../components/marketing/MarketingProductPreview";
import MarketingSocialProof from "../components/marketing/MarketingSocialProof";

async function loadMergedMessages(locale) {
  try {
    const mod = await import("../lib/messages");
    const fn = mod?.getMergedMessages;
    if (typeof fn !== "function") return {};
    return fn(locale);
  } catch {
    return {};
  }
}

function buildSafeMarketingMessages(raw) {
  const section = (value) => (value && typeof value === "object" && !Array.isArray(value) ? value : {});
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  return {
    nav: {},
    hero: {},
    features: section(source.features),
    product: section(source.product),
    howItWorks: section(source.howItWorks),
    socialProof: section(source.socialProof),
    cta: section(source.cta),
    footer: {},
    ...source,
  };
}

export const metadata = {
  title: "Synthr — CRM and listing distribution for agencies",
  description:
    "Synthr is a real estate CRM and listing distribution platform for agencies that helps them manage leads, publish listings, and close deals faster.",
};

export default async function MarketingHomePage() {
  const locale = "en";
  const messages = buildSafeMarketingMessages(await loadMergedMessages(locale));
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
