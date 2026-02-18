import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/', label: 'Home', end: true },
  { to: '/simulator', label: 'Simulator', end: false },
  { to: '/compare', label: 'Compare', end: false },
  { to: '/saved', label: 'Saved', end: false },
]

export default function Sidebar() {
  return (
    <nav className="w-48 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col py-4 gap-1">
      {NAV_ITEMS.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            [
              'px-4 py-2 text-sm rounded-md mx-2 transition-colors',
              isActive
                ? 'bg-indigo-600 text-white font-medium'
                : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800',
            ].join(' ')
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
