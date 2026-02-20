import { useCarSearch } from '@/hooks/useCarSearch'
import { useCarStore } from '@/store/carStore'
import CarCard from './CarCard'

function SearchIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

export default function CarSearch() {
  const { query, setQuery, results } = useCarSearch()
  const selectedCarId = useCarStore(state => state.selectedCarId)
  const selectCar = useCarStore(state => state.selectCar)

  return (
    <div className="flex flex-col gap-2">
      {/* Command-palette style search input */}
      <div className="relative">
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--color-text-3)' }}
        >
          <SearchIcon />
        </span>
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Supra, Mustang, Corvette…"
          className="w-full pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-1)',
            fontFamily: 'var(--font-ui)',
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = 'var(--color-border-2)'
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(245,158,11,0.15)'
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = 'var(--color-border)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--color-text-3)' }}
            aria-label="Clear search"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        {results.length === 0 ? (
          <p className="text-xs py-2" style={{ color: 'var(--color-text-3)', fontFamily: 'var(--font-ui)' }}>
            No cars found matching &ldquo;{query}&rdquo;
          </p>
        ) : (
          results.map(car => (
            <CarCard
              key={car.id}
              car={car}
              isSelected={car.id === selectedCarId}
              onSelect={() => selectCar(car.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
