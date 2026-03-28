import Link from "next/link";
import PublicLanguageSwitcher from "../PublicLanguageSwitcher";

const nav = [
  { href: "#features", label: "Why Synthr" },
  { href: "#product", label: "Product" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#social-proof", label: "Trust" },
];

export default function MarketingHeader({ m, locale }) {
  const navItems = [
    { href: "#features", label: m?.nav?.why ?? nav[0].label },
    { href: "#product", label: m?.nav?.product ?? nav[1].label },
    { href: "#how-it-works", label: m?.nav?.how ?? nav[2].label },
    { href: "#pricing", label: m?.nav?.pricing ?? nav[3].label },
    { href: "#social-proof", label: m?.nav?.trust ?? nav[4].label },
  ];
  return (
    <header className="mk-header">
      <div className="mk-header__inner shell">
        <Link href="/" className="mk-logo">
          Synthr
        </Link>
        <nav className="mk-nav" aria-label="Primary">
          <ul className="mk-nav__list">
            {navItems.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="mk-nav__link">
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <Link href="/listings" className="mk-nav__link mk-nav__link--muted">
                {m?.nav?.demoListings ?? "Demo listings"}
              </Link>
            </li>
          </ul>
        </nav>
        <div className="mk-header__tools">
          <PublicLanguageSwitcher locale={locale} className="mk-lang-switch" />
          <a href="https://app.synthrstate.com/login/" className="mk-btn mk-btn--header">
            {m?.nav?.startFree ?? "Start free"}
          </a>
        </div>
      </div>
    </header>
  );
}
