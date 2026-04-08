import MarketingHeroMockup from "./MarketingHeroMockup";

const DEFAULT_HEADLINE = "A modern workspace for your real estate agency";
const DEFAULT_SUBHEADLINE =
  "Manage contacts, leads, and listings in one unified system. Boost your team's productivity and close more deals with less effort.";
const EN_DEMO_CARD = {
  title: "Try the demo",
  body: "Open the app and see how Synthr works",
  emailLabel: "Email",
  passwordLabel: "Password",
  openApp: "Open app",
};
const DEMO_CARD_BY_LOCALE = {
  en: EN_DEMO_CARD,
  cs: { title: "Vyzkousejte demo", body: "Otevrete aplikaci a podivejte se, jak Synthr funguje", emailLabel: "E-mail", passwordLabel: "Heslo", openApp: "Otevrit aplikaci" },
  da: { title: "Prov demoen", body: "Aben appen og se, hvordan Synthr fungerer", emailLabel: "E-mail", passwordLabel: "Adgangskode", openApp: "Aben app" },
  de: { title: "Demo testen", body: "Offnen Sie die App und sehen Sie, wie Synthr funktioniert", emailLabel: "E-Mail", passwordLabel: "Passwort", openApp: "App offnen" },
  el: { title: "Δοκιμαστε την επιδειξη", body: "Μπειτε στην εφαρμογη και δειτε πως λειτουργει το Synthr", emailLabel: "Ηλεκτρονικο ταχυδρομειο", passwordLabel: "Κωδικος", openApp: "Ανοιγμα εφαρμογης" },
  es: { title: "Probar la demo", body: "Abre la app y mira como funciona Synthr", emailLabel: "Correo", passwordLabel: "Contrasena", openApp: "Abrir app" },
  fi: { title: "Kokeile demoa", body: "Avaa sovellus ja katso, miten Synthr toimii", emailLabel: "Sahkoposti", passwordLabel: "Salasana", openApp: "Avaa sovellus" },
  fr: { title: "Essayer la demo", body: "Ouvrez l'application et voyez comment Synthr fonctionne", emailLabel: "E-mail", passwordLabel: "Mot de passe", openApp: "Ouvrir l'app" },
  hr: { title: "Isprobajte demo", body: "Otvorite aplikaciju i pogledajte kako Synthr radi", emailLabel: "E-mail", passwordLabel: "Lozinka", openApp: "Otvori aplikaciju" },
  hu: { title: "Probald ki a demot", body: "Nyisd meg az alkalmazast, es nezd meg, hogyan mukodik a Synthr", emailLabel: "E-mail", passwordLabel: "Jelszo", openApp: "Alkalmazas megnyitasa" },
  it: { title: "Prova la demo", body: "Apri l'app e guarda come funziona Synthr", emailLabel: "Email", passwordLabel: "Password", openApp: "Apri app" },
  nl: { title: "Probeer de demo", body: "Open de app en bekijk hoe Synthr werkt", emailLabel: "E-mail", passwordLabel: "Wachtwoord", openApp: "Open app" },
  pl: { title: "Wyprobuj demo", body: "Otworz aplikacje i zobacz, jak dziala Synthr", emailLabel: "E-mail", passwordLabel: "Haslo", openApp: "Otworz aplikacje" },
  pt: { title: "Experimente a demo", body: "Abra a app e veja como o Synthr funciona", emailLabel: "E-mail", passwordLabel: "Senha", openApp: "Abrir app" },
  ro: { title: "Incearca demo", body: "Deschide aplicatia si vezi cum functioneaza Synthr", emailLabel: "E-mail", passwordLabel: "Parola", openApp: "Deschide aplicatia" },
  sv: { title: "Prova demon", body: "Oppna appen och se hur Synthr fungerar", emailLabel: "E-post", passwordLabel: "Losenord", openApp: "Oppna app" },
  tr: { title: "Demoyu deneyin", body: "Uygulamayi acin ve Synthr'in nasil calistigini gorun", emailLabel: "E-posta", passwordLabel: "Sifre", openApp: "Uygulamayi ac" },
};

export default function MarketingHero({ m, locale = "en" }) {
  const adminBase = (process.env.NEXT_PUBLIC_ADMIN_APP_URL ?? "https://app.synthrstate.com").replace(/\/$/, "");
  const h = m?.hero ?? {};
  const dc = m?.demoCard ?? {};
  const lang = String(locale || "en").toLowerCase().split("-")[0];
  const fallbackDemo = DEMO_CARD_BY_LOCALE[lang] ?? DEMO_CARD_BY_LOCALE.en;
  const accent = typeof h.accent === "string" ? h.accent : "";
  const legacyHeadline = typeof h.title === "string" ? `${h.title}${accent}`.trim() : "";
  const legacySubheadline = typeof h.lead === "string" ? h.lead : "";
  const hasLocalizedLegacy = Boolean(legacyHeadline);
  const isHeadlineDefaultEnglish = h.headline === DEFAULT_HEADLINE;
  const isSubheadlineDefaultEnglish = h.subheadline === DEFAULT_SUBHEADLINE;
  const headline = hasLocalizedLegacy && (h.headline == null || isHeadlineDefaultEnglish) ? legacyHeadline : (h.headline ?? DEFAULT_HEADLINE);
  const subheadline = legacySubheadline && (h.subheadline == null || isSubheadlineDefaultEnglish) ? legacySubheadline : (h.subheadline ?? DEFAULT_SUBHEADLINE);
  const startFree = m?.nav?.startFree ?? "Start free";
  const app17 = h.app17 ?? "The full app is available in 17 languages.";
  const pickDemoText = (value, englishValue, localizedFallback) => {
    if (typeof value === "string" && value.trim() && (lang === "en" || value !== englishValue)) {
      return value;
    }
    return localizedFallback;
  };
  const demoTitle = pickDemoText(dc.title, EN_DEMO_CARD.title, fallbackDemo.title);
  const demoBody = pickDemoText(dc.body, EN_DEMO_CARD.body, fallbackDemo.body);
  const demoEmailLabel = pickDemoText(dc.emailLabel, EN_DEMO_CARD.emailLabel, fallbackDemo.emailLabel);
  const demoPasswordLabel = pickDemoText(dc.passwordLabel, EN_DEMO_CARD.passwordLabel, fallbackDemo.passwordLabel);
  const demoEmailValue = dc.emailValue ?? "demo@synthrstate.com";
  const demoPasswordValue = dc.passwordValue ?? "demosynthr1";
  const demoOpenApp = pickDemoText(dc.openApp, EN_DEMO_CARD.openApp, fallbackDemo.openApp);

  return (
    <section className="relative overflow-hidden" aria-labelledby="hero-heading">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(37,99,235,0.14),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 py-20 md:gap-16 md:py-24 lg:grid-cols-2 lg:gap-20 lg:py-28">
          <div className="min-w-0 text-center lg:text-left">
            <h1
              id="hero-heading"
              className="text-balance text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl lg:text-[2.65rem] lg:leading-[1.12]"
            >
              {headline}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-neutral-600 sm:text-lg lg:mx-0 lg:max-w-[34rem]">
              {subheadline}
            </p>

            <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:justify-start lg:justify-start">
              <a
                href={`${adminBase}/signup/`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[2.75rem] items-center justify-center rounded-xl bg-neutral-900 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800"
              >
                {startFree}
              </a>
            </div>
            <p className="mt-8 text-sm text-neutral-500">{app17}</p>

            <aside
              className="mx-auto mt-6 w-full max-w-xl rounded-2xl border border-neutral-200/90 bg-white/95 p-4 text-left shadow-[0_18px_40px_-24px_rgba(15,23,42,0.45)] backdrop-blur sm:p-5 lg:mx-0"
              aria-label={demoTitle}
            >
              <h2 className="text-sm font-semibold tracking-tight text-neutral-900">{demoTitle}</h2>
              <p className="mt-1 text-sm text-neutral-600">{demoBody}</p>

              <dl className="mt-4 space-y-3">
                <div>
                  <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-neutral-500">{demoEmailLabel}</dt>
                  <dd className="mt-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-[0.84rem] text-neutral-900">
                    {demoEmailValue}
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                    {demoPasswordLabel}
                  </dt>
                  <dd className="mt-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-[0.84rem] text-neutral-900">
                    {demoPasswordValue}
                  </dd>
                </div>
              </dl>

              <a
                href={adminBase}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                style={{ backgroundColor: "#2563eb", color: "#ffffff", border: "1px solid #2563eb", textDecoration: "none" }}
              >
                {demoOpenApp}
              </a>
            </aside>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div
              className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-tr from-blue-600/20 via-violet-500/10 to-transparent opacity-90 blur-3xl"
              aria-hidden
            />
            <MarketingHeroMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
