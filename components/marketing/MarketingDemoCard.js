/**
 * Demo credentials + CTA — separate from hero for clearer conversion layout.
 * @param {{ m: Record<string, any> }} props
 */
export default function MarketingDemoCard({ m }) {
  const adminBase = (process.env.NEXT_PUBLIC_ADMIN_APP_URL ?? "https://app.synthrstate.com").replace(/\/$/, "");
  const d = m?.demoCard ?? {};
  const title = d.title ?? "Try the demo";
  const body = d.body ?? "Open the app and see how Synthr works";
  const emailLabel = d.emailLabel ?? "Email";
  const passwordLabel = d.passwordLabel ?? "Password";
  const emailValue = d.emailValue ?? "demo@synthrstate.com";
  const passwordValue = d.passwordValue ?? "demosynthr1";
  const openApp = d.openApp ?? "Open app";

  return (
    <section className="border-b border-neutral-200/80 bg-gradient-to-b from-neutral-50/90 to-neutral-50 py-12 md:py-14" aria-labelledby="demo-card-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-md shadow-neutral-900/5 ring-1 ring-black/[0.03] md:p-7">
          <h2 id="demo-card-heading" className="text-lg font-semibold tracking-tight text-neutral-900 md:text-xl">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600 md:text-[0.9375rem]">{body}</p>

          <dl className="mt-5 space-y-3 rounded-xl bg-neutral-50/90 px-4 py-3 text-sm ring-1 ring-neutral-200/80">
            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
              <dt className="shrink-0 font-medium text-neutral-500">{emailLabel}</dt>
              <dd className="font-mono text-neutral-900">{emailValue}</dd>
            </div>
            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
              <dt className="shrink-0 font-medium text-neutral-500">{passwordLabel}</dt>
              <dd className="font-mono text-neutral-900">{passwordValue}</dd>
            </div>
          </dl>

          <div className="mt-6">
            <a
              href={adminBase}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 sm:w-auto sm:min-w-[200px]"
            >
              {openApp}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
