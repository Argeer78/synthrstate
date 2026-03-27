import MarketingCta from "../components/marketing/MarketingCta";
import MarketingFeatures from "../components/marketing/MarketingFeatures";
import MarketingFooter from "../components/marketing/MarketingFooter";
import MarketingHeader from "../components/marketing/MarketingHeader";
import MarketingHero from "../components/marketing/MarketingHero";
import MarketingHowItWorks from "../components/marketing/MarketingHowItWorks";
import MarketingPricing from "../components/marketing/MarketingPricing";
import MarketingProductPreview from "../components/marketing/MarketingProductPreview";
import MarketingSocialProof from "../components/marketing/MarketingSocialProof";
import { getMessages } from "../lib/i18n";
import { getRequestLocale } from "../lib/i18n.server";

export async function generateMetadata() {
  const locale = await getRequestLocale();
  const m = getMessages(locale);
  return {
    title: m.meta.title,
    description: m.meta.description,
    openGraph: {
      title: m.meta.title,
      description: m.meta.description,
      type: "website",
      url: "https://synthrstate.com",
    },
    twitter: {
      card: "summary_large_image",
      title: m.meta.title,
      description: m.meta.description,
    },
  };
}

export default async function MarketingHomePage() {
  const locale = await getRequestLocale();
  const m = getMessages(locale);
  const shareUrl = encodeURIComponent("https://synthrstate.com");
  const shareText = encodeURIComponent(m.meta.description);
  return (
    <>
      <MarketingHeader m={m} />
      <main>
        <MarketingHero m={m} />
        <MarketingFeatures m={m} />
        <MarketingProductPreview m={m} />
        <MarketingHowItWorks m={m} />
        <MarketingPricing m={m} />
        <MarketingSocialProof m={m} />
        <section className="mk-section mk-section--alt" style={{ paddingTop: "1.25rem", paddingBottom: "1.25rem" }}>
          <div className="shell" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <strong>{m.share.title}:</strong>
            <a className="mk-btn mk-btn--ghost" target="_blank" rel="noopener noreferrer" href={`https://x.com/intent/tweet?url=${shareUrl}&text=${shareText}`}>{m.share.x}</a>
            <a className="mk-btn mk-btn--ghost" target="_blank" rel="noopener noreferrer" href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}>{m.share.facebook}</a>
            <a className="mk-btn mk-btn--ghost" target="_blank" rel="noopener noreferrer" href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}>{m.share.linkedin}</a>
            <a className="mk-btn mk-btn--ghost" target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(`Synthr - ${decodeURIComponent(shareUrl)}`)}`}>{m.share.whatsapp}</a>
          </div>
        </section>
        <MarketingCta m={m} />
      </main>
      <MarketingFooter m={m} />
    </>
  );
}
