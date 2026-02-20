import { useUnitStore } from '@/store/unitStore'

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { units, toggleUnits } = useUnitStore()

  return (
    <header className="shrink-0 bg-panel border-b border-line relative z-30">
      <div className="flex items-center gap-4 px-4 lg:px-6 py-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="lg:hidden flex flex-col gap-[5px] p-1.5 rounded hover:bg-raised transition-colors"
          aria-label="Toggle navigation"
        >
          <span className="block w-5 h-[2px] bg-gray-400 rounded-full" />
          <span className="block w-5 h-[2px] bg-gray-400 rounded-full" />
          <span className="block w-3.5 h-[2px] bg-gray-400 rounded-full" />
        </button>

        {/* Brand */}
        <div className="flex items-baseline gap-3 min-w-0">
          <span className="font-display text-2xl font-bold tracking-tight text-signal-hi leading-none uppercase">
            ThrustCurves
          </span>
          <span className="hidden sm:block font-display text-sm font-medium tracking-widest uppercase text-label">
            Performance Simulator
          </span>
        </div>

        {/* Right — unit toggle + live indicator */}
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={toggleUnits}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-line bg-lift hover:bg-raised transition-colors"
            aria-label={`Switch to ${units === 'imperial' ? 'metric' : 'imperial'} units`}
          >
            <span
              className={`font-data text-xs font-semibold tracking-wider tabular-nums transition-colors ${units === 'imperial' ? 'text-signal-hi' : 'text-muted-txt'}`}
            >
              MPH
            </span>
            <span className="font-data text-xs text-muted-txt">/</span>
            <span
              className={`font-data text-xs font-semibold tracking-wider tabular-nums transition-colors ${units === 'metric' ? 'text-signal-hi' : 'text-muted-txt'}`}
            >
              KMH
            </span>
          </button>
          <div className="hidden lg:flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-signal animate-pulse" />
            <span className="font-data text-xs text-muted-txt tracking-wider">LIVE</span>
          </div>
        </div>
      </div>

      {/* Signal red bottom rule */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-signal via-signal/40 to-transparent" />
    </header>
  )
}
