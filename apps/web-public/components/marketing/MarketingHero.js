import Link from "next/link";

export default function MarketingHero() {
  const adminBase = (process.env.NEXT_PUBLIC_ADMIN_APP_URL ?? "https://app.synthrstate.com").replace(/\/$/, "");
  return (
    <section className="mk-hero" aria-labelledby="hero-heading">
      <div className="mk-hero__glow" aria-hidden />
      <div className="shell mk-hero__inner">
        <p className="mk-eyebrow">All-in-one agency workspace</p>
        <h1 id="hero-heading" className="mk-hero__title">
          Synthr is a real estate CRM and listing distribution platform for agencies
          <span className="mk-hero__title-accent"> that helps them win more deals with less admin work.</span>
        </h1>
        <p className="mk-hero__lead">
          Manage contacts, leads, tasks, listings, publishing, and inquiries in one system. Your team stays aligned,
          your listings go live faster, and every inquiry is tracked from first message to closed deal.
        </p>
        <div className="mk-hero__actions">
          <a href={`${adminBase}/login/`} className="mk-btn mk-btn--primary">
            Start free
          </a>
          <Link href="/listings" className="mk-btn mk-btn--ghost">
            View demo
          </Link>
        </div>
      </div>
    </section>
  );
}
