/**
 * Placeholder dashboard visual — SaaS-style panel with soft 3D tilt.
 */
export default function MarketingHeroMockup() {
  return (
    <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
      <div
        className="pointer-events-none absolute -inset-8 rounded-[2rem] bg-gradient-to-br from-blue-500/25 via-violet-500/15 to-transparent blur-2xl"
        aria-hidden
      />
      <div
        className="relative rounded-2xl border border-neutral-200/90 bg-white p-3 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.18)] ring-1 ring-black/5"
        style={{
          transform: "perspective(1200px) rotateY(-7deg) rotateX(5deg)",
          transformStyle: "preserve-3d",
        }}
      >
        <div className="flex gap-2 rounded-xl bg-neutral-100/90 p-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/90" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" />
        </div>
        <div className="mt-3 flex gap-3">
          <div className="hidden w-[22%] shrink-0 flex-col gap-2 sm:flex">
            <div className="h-2 w-full rounded bg-neutral-200/90" />
            <div className="h-2 w-4/5 rounded bg-blue-600/20" />
            <div className="h-2 w-full rounded bg-neutral-200/70" />
            <div className="h-2 w-3/5 rounded bg-neutral-200/70" />
            <div className="mt-2 h-16 w-full rounded-lg bg-gradient-to-b from-neutral-100 to-neutral-50 ring-1 ring-neutral-200/80" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="h-2.5 w-28 rounded bg-neutral-300/90" />
              <div className="h-7 rounded-lg bg-neutral-900 px-3 text-[10px] font-semibold leading-7 text-white shadow-sm">
                CRM
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-gradient-to-br from-blue-600/10 to-blue-600/5 p-2 ring-1 ring-blue-600/15">
                <div className="h-2 w-8 rounded bg-blue-600/30" />
                <div className="mt-2 text-lg font-bold tabular-nums text-neutral-800">24</div>
                <div className="mt-0.5 h-1.5 w-14 rounded bg-neutral-300/80" />
              </div>
              <div className="rounded-lg bg-neutral-50 p-2 ring-1 ring-neutral-200/80">
                <div className="h-2 w-10 rounded bg-neutral-300/80" />
                <div className="mt-2 text-lg font-bold tabular-nums text-neutral-800">12</div>
                <div className="mt-0.5 h-1.5 w-12 rounded bg-neutral-200" />
              </div>
              <div className="rounded-lg bg-neutral-50 p-2 ring-1 ring-neutral-200/80">
                <div className="h-2 w-9 rounded bg-neutral-300/80" />
                <div className="mt-2 text-lg font-bold tabular-nums text-neutral-800">8</div>
                <div className="mt-0.5 h-1.5 w-10 rounded bg-neutral-200" />
              </div>
            </div>
            <div className="space-y-2 rounded-xl bg-neutral-50/90 p-3 ring-1 ring-neutral-200/70">
              <div className="flex gap-2">
                <div className="h-10 flex-1 rounded-lg bg-white shadow-sm ring-1 ring-neutral-200/80" />
                <div className="h-10 flex-1 rounded-lg bg-white shadow-sm ring-1 ring-neutral-200/80" />
              </div>
              <div className="h-2 w-full rounded bg-neutral-200/80" />
              <div className="h-2 w-[92%] rounded bg-neutral-200/60" />
              <div className="h-2 w-[78%] rounded bg-neutral-200/50" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
