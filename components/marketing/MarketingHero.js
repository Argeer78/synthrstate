import Link from "next/link";

export default function MarketingHero({ m }) {
  const adminBase = (process.env.NEXT_PUBLIC_ADMIN_APP_URL ?? "https://app.synthrstate.com").replace(/\/$/, "");
  return (
    <section className="mk-hero" aria-labelledby="hero-heading">
      <div className="mk-hero__glow" aria-hidden />
      <div className="shell mk-hero__inner">
        <p className="mk-eyebrow">{m?.hero?.eyebrow ?? "All-in-one agency workspace"}</p>
        <h1 id="hero-heading" className="mk-hero__title">
          {m?.hero?.title ?? "Synthr is a real estate CRM and listing distribution platform for agencies"}
          <span className="mk-hero__title-accent">{m?.hero?.accent ?? " that helps them win more deals with less admin work."}</span>
        </h1>
        <p className="mk-hero__lead">
          {m?.hero?.lead ??
            "Manage contacts, leads, tasks, listings, publishing, and inquiries in one system. Your team stays aligned, your listings go live faster, and every inquiry is tracked from first message to closed deal."}
        </p>
        <div className="mk-hero__actions">
          <a href={`${adminBase}/login/`} className="mk-btn mk-btn--primary">
            {m?.nav?.startFree ?? "Start free"}
          </a>
          <Link href="/listings" className="mk-btn mk-btn--ghost">
            {m?.hero?.viewDemo ?? "View demo"}
          </Link>
        </div>
        <p className="mk-hero__lead" style={{ marginTop: "1rem", fontSize: "0.98rem" }}>
          Click here:{" "}
          <a href={`${adminBase}/login/`} target="_blank" rel="noopener noreferrer">
            app.synthrstate.com
          </a>{" "}
          (new tab). Login with username: <strong>demo@synthrstate.com</strong> and password: <strong>demosynthr1</strong> to see how it works.
        </p>
        <p className="mk-hero__lead" style={{ marginTop: 0 }}>
          {m?.hero?.app17 ?? "The full app is 17 languages ready."}
        </p>
      </div>
    </section>
  );
}
