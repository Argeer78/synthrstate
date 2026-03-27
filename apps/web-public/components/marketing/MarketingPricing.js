function CheckIcon({ className }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M13.5 4.5L6.5 11.5L2.5 7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const tiers = [
  {
    id: "starter",
    name: "Starter",
    price: "€49",
    period: "/month",
    description: "For small agencies that need core CRM, listings, and distribution in one clean workflow.",
    cta: "Start free",
    ctaVariant: "secondary",
    featured: false,
    action: "checkout",
    features: [
      "Up to 3 team seats",
      "Limited active listings",
      "Basic CRM — contacts & pipeline",
      "Property & listing records",
      "Public website + XML feed",
      "Email support",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: "€129",
    period: "/month",
    description: "For growing agencies that need stronger automation, AI support, and reliable publishing.",
    cta: "Start free",
    ctaVariant: "primary",
    featured: true,
    action: "checkout",
    features: [
      "Unlimited listings",
      "Full CRM — contacts, leads, tasks & notes",
      "AI listing descriptions & lead summaries",
      "Gmail integration (connect and sync)",
      "Multi-channel publishing & queue-based sync",
      "Publication logs & retry-safe exports",
      "Priority support",
      "Everything in Starter",
    ],
  },
  {
    id: "custom",
    name: "Custom / Enterprise",
    price: "Custom",
    period: "",
    description: "For multi-office agencies that need custom workflows, integrations, and rollout support.",
    cta: "Talk to sales",
    ctaVariant: "secondary",
    featured: false,
    action: "sales",
    features: [
      "Advanced team governance",
      "Workflow automation & guardrails",
      "API access for your stack",
      "Custom integrations & channel adapters",
      "Dedicated onboarding & success",
      "SLA options",
      "Tailored onboarding and migration support",
    ],
  },
];

export default function MarketingPricing() {
  const adminBase = (process.env.NEXT_PUBLIC_ADMIN_APP_URL ?? "https://app.synthrstate.com").replace(/\/$/, "");
  const supportEmail = process.env.NEXT_PUBLIC_BILLING_SUPPORT_EMAIL ?? "sypport@synthrstate.com";

  return (
    <section
      id="pricing"
      className="scroll-mt-20 border-t border-neutral-200/80 bg-gradient-to-b from-neutral-50 to-white py-20 lg:py-28"
      aria-labelledby="pricing-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="pricing-heading"
            className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl"
          >
            Pricing built for agency growth
          </h2>
          <p className="mt-4 text-base leading-relaxed text-neutral-600 sm:text-lg">
            Start simple, scale when your team grows. Monthly pricing in EUR.
          </p>
        </div>

        {/* Toggle-ready: monthly live; annual reserved for later */}
        <div className="mt-10 flex justify-center" role="group" aria-label="Billing period">
          <div className="inline-flex items-center gap-1 rounded-full border border-neutral-200/90 bg-white p-1 shadow-sm">
            <span className="rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white">
              Monthly
            </span>
            <span
              className="rounded-full px-4 py-2 text-sm font-medium text-neutral-400"
              title="Annual billing coming soon"
            >
              Annual <span className="text-xs font-normal text-neutral-400">(soon)</span>
            </span>
          </div>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-6 lg:mt-16 lg:grid-cols-3 lg:gap-5 lg:items-stretch">
          {tiers.map((tier) => (
            <article
              key={tier.id}
              className={[
                "relative flex flex-col rounded-2xl border bg-white p-7 shadow-sm transition-shadow duration-200",
                tier.featured
                  ? "z-10 border-blue-500/40 shadow-md shadow-blue-500/[0.08] ring-1 ring-blue-500/25 lg:-my-2 lg:py-9"
                  : "border-neutral-200/90 hover:border-neutral-300 hover:shadow-md",
              ].join(" ")}
            >
              {tier.featured ? (
                <p className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
                  Most popular
                </p>
              ) : null}

              <div className="flex flex-1 flex-col">
                <h3 className="text-lg font-semibold text-neutral-950">{tier.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tracking-tight text-neutral-950">{tier.price}</span>
                  {tier.period ? (
                    <span className="text-sm font-medium text-neutral-500">{tier.period}</span>
                  ) : null}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">{tier.description}</p>

                <ul className="mt-8 flex flex-1 flex-col gap-3 text-sm text-neutral-700">
                  {tier.features.map((line) => (
                    <li key={line} className="flex gap-3">
                      <CheckIcon
                        className={
                          tier.featured
                            ? "mt-0.5 shrink-0 text-blue-600"
                            : "mt-0.5 shrink-0 text-neutral-400"
                        }
                      />
                      <span className="leading-snug">{line}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={
                    tier.action === "checkout"
                      ? `${adminBase}/billing/`
                      : `mailto:${supportEmail}?subject=Synthr%20${encodeURIComponent(tier.name)}%20plan`
                  }
                  className={[
                    "mt-8 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                    tier.ctaVariant === "primary"
                      ? "bg-neutral-950 text-white hover:bg-neutral-800 focus-visible:outline-neutral-950"
                      : "border border-neutral-200 bg-white text-neutral-950 hover:bg-neutral-50 focus-visible:outline-neutral-400",
                  ].join(" ")}
                >
                  {tier.cta}
                </a>
              </div>
            </article>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-xl text-center text-xs leading-relaxed text-neutral-500">
          Need migration support or custom integration work? Choose Custom / Enterprise and we will scope it with
          your team.
        </p>
      </div>
    </section>
  );
}
