import Link from "next/link";

export default function MarketingHero() {
  return (
    <section className="mk-hero" aria-labelledby="hero-heading">
      <div className="mk-hero__glow" aria-hidden />
      <div className="shell mk-hero__inner">
        <p className="mk-eyebrow">Real estate operating system</p>
        <h1 id="hero-heading" className="mk-hero__title">
          CRM and listing distribution,
          <span className="mk-hero__title-accent"> built for agencies</span>
        </h1>
        <p className="mk-hero__lead">
          Synthr unifies contacts, pipelines, and properties in one place — then publishes your listings to
          your website and partner channels without losing control of the data.
        </p>
        <div className="mk-hero__actions">
          <a href="#contact" className="mk-btn mk-btn--primary">
            Request access
          </a>
          <Link href="/listings" className="mk-btn mk-btn--ghost">
            View demo listings
          </Link>
        </div>
      </div>
    </section>
  );
}
