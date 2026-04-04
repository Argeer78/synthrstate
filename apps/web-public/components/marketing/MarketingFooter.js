import Link from "next/link";

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@synthrstate.com";

export default function MarketingFooter({ m }) {
  const year = new Date().getFullYear();
  const f = m?.footer;
  return (
    <footer className="mk-footer">
      <div className="shell mk-footer__inner">
        <div className="mk-footer__brand">
          <Link href="/" className="mk-logo mk-logo--footer">
            Synthr
          </Link>
          <p className="mk-footer__tagline">{m?.footer?.tagline ?? "Real estate CRM, listings, and distribution in one workflow."}</p>
        </div>
        <div className="mk-footer__cols">
          <div>
            <p className="mk-footer__col-title">{m?.footer?.product ?? "Product"}</p>
            <ul className="mk-footer__links">
              <li>
                <a href="#features">{m?.footer?.features ?? "Features"}</a>
              </li>
              <li>
                <a href="#product">Product</a>
              </li>
              <li>
                <a href="#pricing">Pricing</a>
              </li>
              <li>
                <Link href="/listings">{m?.nav?.demoListings ?? "Demo listings"}</Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="mk-footer__col-title">{f?.company ?? "Company"}</p>
            <ul className="mk-footer__links">
              <li>
                <a href="#contact">{f?.contact ?? "Contact"}</a>
              </li>
              <li>
                <a href={`mailto:${SUPPORT_EMAIL}`}>
                  {f?.supportLabel ?? "Support"}: {SUPPORT_EMAIL}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="mk-footer__col-title">{f?.legal ?? "Legal"}</p>
            <ul className="mk-footer__links">
              <li>
                <Link href="/terms/">{f?.terms ?? "Terms of Service"}</Link>
              </li>
              <li>
                <Link href="/privacy/">{f?.privacy ?? "Privacy Policy"}</Link>
              </li>
              <li>
                <Link href="/cookies/">{f?.cookies ?? "Cookie Policy"}</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="mk-footer__bar">
        <div className="shell mk-footer__bar-inner">
          <p className="mk-footer__legal">© {year} Synthr. {m?.footer?.rights ?? "All rights reserved."}</p>
          <a
            href="https://alphasynthai.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mk-footer__powered"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/alphasynth-logo.png"
              alt=""
              width={28}
              height={28}
              className="mk-footer__powered-logo"
            />
            <span className="mk-footer__powered-text">{m?.footer?.powered ?? "Powered by AlphaSynth AI"}</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
