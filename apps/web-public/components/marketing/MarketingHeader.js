import Link from "next/link";

const nav = [
  { href: "#features", label: "Why Synthr" },
  { href: "#product", label: "Product" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#social-proof", label: "Trust" },
];

export default function MarketingHeader() {
  return (
    <header className="mk-header">
      <div className="mk-header__inner shell">
        <Link href="/" className="mk-logo">
          Synthr
        </Link>
        <nav className="mk-nav" aria-label="Primary">
          <ul className="mk-nav__list">
            {nav.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="mk-nav__link">
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <Link href="/listings" className="mk-nav__link mk-nav__link--muted">
                Demo listings
              </Link>
            </li>
          </ul>
        </nav>
        <a href="https://app.synthrstate.com/login/" className="mk-btn mk-btn--header">
          Start free
        </a>
      </div>
    </header>
  );
}
