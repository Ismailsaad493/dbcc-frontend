import logoBadge from '../assets/dbcc-logo-badge.png'

export default function Header() {
  return (
    <header className="relative overflow-hidden border-b border-purple-500/20 bg-gradient-to-b from-[#1a0f2e] to-[#0b0712] px-4 py-8 text-center sm:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(192,132,252,0.12),_transparent_60%)]" />
      <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-2">
        <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-amber-400/70 shadow-[0_0_20px_rgba(251,191,36,0.25)]">
          <img
            src={logoBadge}
            alt="DBCC Crest"
            className="h-full w-full scale-[1.12] object-cover object-top"
          />
        </div>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-5xl">
          <span className="bg-gradient-to-r from-amber-300 via-amber-100 to-amber-300 bg-clip-text text-transparent">
            DBCC
          </span>
        </h1>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-purple-300 sm:text-base">
          Monthly Reward System
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Divine Believers Cricket Club &middot; Play Hard. Play Fair. Play Together.
        </p>
      </div>
    </header>
  )
}
