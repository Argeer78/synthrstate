import MarketingCta from "../components/marketing/MarketingCta";
import MarketingFeatures from "../components/marketing/MarketingFeatures";
import MarketingFooter from "../components/marketing/MarketingFooter";
import MarketingHeader from "../components/marketing/MarketingHeader";
import MarketingHero from "../components/marketing/MarketingHero";
import MarketingHowItWorks from "../components/marketing/MarketingHowItWorks";
import MarketingPricing from "../components/marketing/MarketingPricing";
import MarketingProductPreview from "../components/marketing/MarketingProductPreview";
import MarketingSocialProof from "../components/marketing/MarketingSocialProof";
import { getRequestLocale } from "../lib/i18n.server";

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
  const home = section(source.home);
  const pickSection = (name) => section(home[name] ?? source[name]);
  const pickFlat = (name) => section(home[name] ?? source[name]);
  return {
    ...source,
    home: {
      ...home,
      nav: pickSection("nav"),
      hero: pickSection("hero"),
      features: pickSection("features"),
      product: pickSection("product"),
      howItWorks: pickSection("howItWorks"),
      socialProof: pickSection("socialProof"),
      cta: pickSection("cta"),
      footer: pickSection("footer"),
    },
    nav: pickFlat("nav"),
    hero: pickFlat("hero"),
    features: pickFlat("features"),
    product: pickFlat("product"),
    howItWorks: pickFlat("howItWorks"),
    socialProof: pickFlat("socialProof"),
    cta: pickFlat("cta"),
    footer: pickFlat("footer"),
  };
}

export const metadata = {
  title: "Synthr — CRM and listing distribution for agencies",
  description:
    "Synthr is a real estate CRM and listing distribution platform for agencies that helps them manage leads, publish listings, and close deals faster.",
};

export default async function MarketingHomePage() {
  const locale = await getRequestLocale();
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
