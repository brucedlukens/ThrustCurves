import { NavLink } from 'react-router-dom'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

const NAV_ITEMS = [
  {
    to: '/',
    label: 'Home',
    end: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    to: '/simulator',
    label: 'Simulator',
    end: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="12" x2="16" y2="14"/>
      </svg>
    ),
  },
  {
    to: '/compare',
    label: 'Compare',
    end: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    to: '/saved',
    label: 'Saved',
    end: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
]

function NavContent({ onClose }: { onClose?: () => void }) {
  return (
    <nav className="flex flex-col h-full py-4">
      {/* Close button — mobile only */}
      {onClose && (
        <div className="flex items-center justify-between px-4 mb-4 md:hidden">
          <span
            className="text-sm font-bold tracking-widest uppercase"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent)' }}
          >
            Menu
          </span>
          <button
            onClick={onClose}
            className="p-1"
            style={{ color: 'var(--color-text-2)' }}
            aria-label="Close menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      {/* Nav items */}
      <div className="flex flex-col gap-0.5 px-2">
        {NAV_ITEMS.map(({ to, label, end, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-3 py-2.5 rounded-sm transition-colors text-sm',
                isActive
                  ? 'border-l-2 pl-[10px]'
                  : 'border-l-2 border-transparent pl-[10px]',
              ].join(' ')
            }
            style={({ isActive }) => ({
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.08em',
              borderLeftColor: isActive ? 'var(--color-accent)' : 'transparent',
              backgroundColor: isActive ? 'var(--color-accent-dim)' : 'transparent',
              color: isActive ? 'var(--color-accent)' : 'var(--color-text-2)',
            })}
          >
            {({ isActive }) => (
              <>
                <span style={{ opacity: isActive ? 1 : 0.7 }}>{icon}</span>
                <span className="uppercase tracking-wider text-xs">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Bottom decorative speed stripes */}
      <div className="mt-auto px-4 pb-4 flex flex-col gap-1">
        <div className="h-px w-full" style={{ backgroundColor: 'var(--color-border)' }} />
        <div className="h-px w-3/4" style={{ backgroundColor: 'var(--color-border)' }} />
        <div className="h-px w-1/2" style={{ backgroundColor: 'var(--color-border)' }} />
      </div>
    </nav>
  )
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar — always visible */}
      <aside
        className="hidden md:flex flex-col w-56 shrink-0"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
        }}
      >
        <NavContent />
      </aside>

      {/* Mobile drawer + backdrop */}
      <div className="md:hidden">
        {/* Backdrop */}
        <div
          className={`fixed inset-0 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Drawer panel */}
        <aside
          className={`fixed left-0 top-0 h-full w-64 z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRight: '1px solid var(--color-border)',
          }}
        >
          <NavContent onClose={onClose} />
        </aside>
      </div>
    </>
  )
}
