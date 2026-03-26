import Link from "next/link";

export default function MarketingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mk-footer">
      <div className="shell mk-footer__inner">
        <div className="mk-footer__brand">
          <Link href="/" className="mk-logo mk-logo--footer">
            Synthr
          </Link>
          <p className="mk-footer__tagline">CRM & listing distribution for real estate agencies.</p>
        </div>
        <div className="mk-footer__cols">
          <div>
            <p className="mk-footer__col-title">Product</p>
            <ul className="mk-footer__links">
              <li>
                <a href="#features">Features</a>
              </li>
              <li>
                <a href="#pricing">Pricing</a>
              </li>
              <li>
                <Link href="/listings">Demo listings</Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="mk-footer__col-title">Company</p>
            <ul className="mk-footer__links">
              <li>
                <a href="#contact">Contact</a>
              </li>
              <li>
                <a href="mailto:contact@synthrstate.com">contact@synthrstate.com</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="mk-footer__bar">
        <div className="shell mk-footer__bar-inner">
          <p className="mk-footer__legal">© {year} Synthr. All rights reserved.</p>
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
            <span className="mk-footer__powered-text">Powered by AlphaSynth AI</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
