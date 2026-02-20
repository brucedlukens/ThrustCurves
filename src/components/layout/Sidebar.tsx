import { NavLink } from 'react-router-dom'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const NAV_ITEMS = [
  {
    to: '/',
    label: 'Home',
    end: true,
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V20.25a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75v-4.5H9.75v4.5a.75.75 0 01-.75.75H3.75A.75.75 0 013 20.25V9.75z" />
      </svg>
    ),
  },
  {
    to: '/simulator',
    label: 'Simulator',
    end: false,
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5l7.5-7.5 3 3 4.5-4.5M21 6v6h-6" />
      </svg>
    ),
  },
  {
    to: '/compare',
    label: 'Compare',
    end: false,
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
  {
    to: '/saved',
    label: 'Saved',
    end: false,
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
      </svg>
    ),
  },
  {
    to: '/custom-car',
    label: 'Custom Car',
    end: false,
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
  },
]

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop: always visible */}
      {/* Mobile: slide-in drawer */}
      <nav
        className={[
          'fixed lg:static z-30 top-0 left-0 h-full lg:h-auto',
          'flex flex-col bg-panel border-r border-line',
          'w-[240px] shrink-0',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        {/* Mobile header inside drawer */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-line">
          <span className="font-display text-xl font-bold tracking-tight text-signal-hi uppercase">
            ThrustCurves
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-raised text-gray-400 hover:text-gray-200 transition-colors"
            aria-label="Close navigation"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav label */}
        <div className="px-4 pt-5 pb-2">
          <span className="font-display text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-txt">
            Navigation
          </span>
        </div>

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
                  'flex items-center gap-3 px-3 py-2.5 rounded-md transition-all',
                  'font-display text-base font-medium tracking-wide',
                  isActive
                    ? 'bg-signal-dim border-l-2 border-signal text-gray-100 pl-[10px]'
                    : 'text-label hover:text-gray-200 hover:bg-raised border-l-2 border-transparent',
                ].join(' ')
              }
            >
              {icon}
              {label}
            </NavLink>
          ))}
        </div>

        {/* Bottom decorative element */}
        <div className="mt-auto p-4 border-t border-faint">
          <div className="flex items-center gap-2 px-1">
            <div className="w-1.5 h-1.5 rounded-full bg-signal" />
            <span className="font-data text-[10px] text-muted-txt tracking-widest uppercase">
              Physics Engine
            </span>
          </div>
        </div>
      </nav>
    </>
  )
}
