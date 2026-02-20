interface HeaderProps {
  onMenuToggle: () => void
  isMobileNavOpen: boolean
}

export default function Header({ onMenuToggle, isMobileNavOpen }: HeaderProps) {
  return (
    <header
      className="flex items-center gap-3 px-5 py-3 shrink-0 relative z-30"
      style={{
        background: 'var(--surface-1)',
        borderBottom: '1px solid var(--border)',
        boxShadow: '0 1px 0 rgba(0, 212, 200, 0.08)',
      }}
    >
      {/* Hamburger — mobile only */}
      <button
        className="md:hidden flex flex-col justify-center gap-1 w-8 h-8 shrink-0 focus:outline-none"
        onClick={onMenuToggle}
        aria-label={isMobileNavOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={isMobileNavOpen}
      >
        <span
          className="block h-0.5 w-5 transition-all duration-200"
          style={{
            background: 'var(--text-secondary)',
            transform: isMobileNavOpen ? 'translateY(6px) rotate(45deg)' : undefined,
          }}
        />
        <span
          className="block h-0.5 w-5 transition-all duration-200"
          style={{
            background: 'var(--text-secondary)',
            opacity: isMobileNavOpen ? 0 : 1,
          }}
        />
        <span
          className="block h-0.5 w-5 transition-all duration-200"
          style={{
            background: 'var(--text-secondary)',
            transform: isMobileNavOpen ? 'translateY(-6px) rotate(-45deg)' : undefined,
          }}
        />
      </button>

      {/* Branding */}
      <div className="flex items-baseline gap-2.5">
        <span
          className="font-display text-xl font-bold tracking-tight"
          style={{ color: 'var(--accent)', letterSpacing: '-0.02em' }}
        >
          ThrustCurves
        </span>
        <span
          className="hidden sm:block font-ui text-sm tracking-wide"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Performance Simulator
        </span>
      </div>

      {/* Decorative teal pulse — far right */}
      <div className="ml-auto flex items-center gap-2">
        <span
          className="hidden md:flex items-center gap-1.5 font-data text-xs"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--accent)', boxShadow: '0 0 4px var(--accent)' }}
          />
          LIVE
        </span>
      </div>
    </header>
  )
}
