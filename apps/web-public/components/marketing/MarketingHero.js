import MarketingHeroMockup from "./MarketingHeroMockup";

export default function MarketingHero({ m }) {
  const adminBase = (process.env.NEXT_PUBLIC_ADMIN_APP_URL ?? "https://app.synthrstate.com").replace(/\/$/, "");
  const h = m?.hero ?? {};
  const dc = m?.demoCard ?? {};
  const headline = h.headline ?? "A modern workspace for your real estate agency";
  const subheadline =
    h.subheadline ??
    "Manage contacts, leads, and listings in one unified system. Boost your team's productivity and close more deals with less effort.";
  const startFree = m?.nav?.startFree ?? "Start free";
  const viewDemo = h.viewDemo ?? "View demo";
  const app17 = h.app17 ?? "The full app is available in 17 languages.";
  const demoTitle = dc.title ?? "Try the demo";
  const demoBody = dc.body ?? "Open the app and see how Synthr works";
  const demoEmailLabel = dc.emailLabel ?? "Email";
  const demoPasswordLabel = dc.passwordLabel ?? "Password";
  const demoEmailValue = dc.emailValue ?? "demo@synthrstate.com";
  const demoPasswordValue = dc.passwordValue ?? "demosynthr1";
  const demoOpenApp = dc.openApp ?? "Open app";

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
              <a
                href={adminBase}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[2.75rem] items-center justify-center rounded-xl border border-neutral-300 bg-white px-6 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-50"
              >
                {viewDemo}
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
