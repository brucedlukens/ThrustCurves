interface HeaderProps {
  onMenuToggle?: () => void
}

export default function Header({ onMenuToggle }: HeaderProps) {
  return (
    <header
      className="flex items-center gap-3 px-4 md:px-6 py-3 shrink-0"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {/* Hamburger — mobile only */}
      <button
        className="md:hidden flex flex-col gap-1.5 p-1 shrink-0"
        onClick={onMenuToggle}
        aria-label="Open navigation menu"
      >
        <span className="block w-5 h-px" style={{ backgroundColor: 'var(--color-text-2)' }} />
        <span className="block w-5 h-px" style={{ backgroundColor: 'var(--color-text-2)' }} />
        <span className="block w-5 h-px" style={{ backgroundColor: 'var(--color-text-2)' }} />
      </button>

      {/* App name */}
      <span
        className="text-xl md:text-2xl font-bold tracking-widest uppercase"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent)' }}
      >
        ThrustCurves
      </span>

      {/* Subtitle — hidden on small screens */}
      <span
        className="hidden sm:block text-sm tracking-wider"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-3)' }}
      >
        CAR PERFORMANCE SIMULATOR
      </span>
    </header>
  )
}
