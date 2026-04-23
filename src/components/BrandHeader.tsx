export function AwardWatchLogo() {
  return (
    <div className="grid size-20 shrink-0 place-items-center rounded-xl bg-zinc-950" aria-label="AwardWatch PH">
      <svg className="size-14" viewBox="0 0 32 32" role="img" aria-hidden="true">
        <path d="M7 6h18v8c0 6.2-3.5 10.3-9 12-5.5-1.7-9-5.8-9-12V6Z" fill="#050505" stroke="#d4d4d8" strokeWidth="1.8" />
        <path d="M11 19V13M16 20V10M21 17v-4" stroke="#d7ff5f" strokeLinecap="round" strokeWidth="2.6" />
        <path d="M10 23h12" stroke="#7dd3fc" strokeLinecap="round" strokeWidth="2" />
      </svg>
    </div>
  );
}

export function BrandHeader() {
  return (
    <header className="relative z-40 border-b border-zinc-900 bg-black px-4 py-5 sm:px-6 lg:px-11">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <AwardWatchLogo />
        <div>
          <h1 className="max-w-5xl text-2xl font-semibold leading-tight tracking-[-0.01em] text-zinc-100 sm:text-3xl lg:text-4xl">AwardWatch PH Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm leading-snug text-zinc-500 sm:text-base">A PhilGEPS contract award tracker for seeing where public procurement money goes, who wins contracts, and how awards shift over time.</p>
        </div>
      </div>
    </header>
  );
}
