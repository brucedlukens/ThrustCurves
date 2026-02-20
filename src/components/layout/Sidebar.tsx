import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  {
    to: '/',
    label: 'Home',
    end: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 1.5L1.5 7v7.5h4v-4h5v4h4V7L8 1.5z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: '/simulator',
    label: 'Simulator',
    end: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2 12 Q5 4 8 7 Q11 10 14 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="7" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    to: '/compare',
    label: 'Compare',
    end: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M3 12V4M8 12V6M13 12V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/saved',
    label: 'Saved',
    end: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M3 2h10a1 1 0 0 1 1 1v10l-4-2-4 2V3a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
      </svg>
    ),
  },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <nav
      className={[
        'sidebar-drawer',
        'flex flex-col py-6 shrink-0 z-30',
        // Desktop: always visible, not fixed
        'md:relative md:translate-x-0 md:w-64',
        // Mobile: fixed drawer
        'fixed top-0 left-0 h-full w-72',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        'md:block',
      ].join(' ')}
      style={{
        background: 'var(--surface-1)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Mobile: logo area at top of drawer */}
      <div
        className="md:hidden px-5 pb-5 mb-2 flex items-center gap-2"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <span
          className="font-display text-lg font-bold"
          style={{ color: 'var(--accent)' }}
        >
          ThrustCurves
        </span>
        <button
          className="ml-auto p-1"
          onClick={onClose}
          aria-label="Close navigation"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Section label */}
      <div
        className="px-5 mb-3 font-ui text-xs tracking-widest uppercase"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Navigation
      </div>

      {/* Nav items */}
      <div className="flex flex-col gap-0.5 px-3">
        {NAV_ITEMS.map(({ to, label, end, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-150',
                'font-ui text-base tracking-wide border-l-2',
                isActive
                  ? 'border-[var(--accent)] text-[var(--accent-text)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
              ].join(' ')
            }
            style={({ isActive }) => ({
              background: isActive ? 'var(--accent-glow)' : undefined,
            })}
          >
            {({ isActive }) => (
              <>
                <span
                  style={{
                    color: isActive ? 'var(--accent)' : 'var(--text-tertiary)',
                    transition: 'color 0.15s',
                  }}
                >
                  {icon}
                </span>
                <span>{label}</span>
                {isActive && (
                  <span
                    className="ml-auto w-1 h-1 rounded-full"
                    style={{ background: 'var(--accent)' }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Bottom decoration */}
      <div className="mt-auto px-5 pt-6">
        <div
          className="rounded-lg p-3"
          style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}
        >
          <p
            className="font-data text-xs"
            style={{ color: 'var(--text-tertiary)' }}
          >
            5 vehicles · OEM dyno data
          </p>
          <p
            className="font-data text-xs mt-0.5"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Supra · Mustang · M3 · Civic · C8
          </p>
        </div>
      </div>
    </nav>
  )
}
