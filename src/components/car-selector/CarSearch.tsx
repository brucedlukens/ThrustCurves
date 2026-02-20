import { useCarSearch } from '@/hooks/useCarSearch'
import { useCarStore } from '@/store/carStore'
import CarCard from './CarCard'

export default function CarSearch() {
  const { query, setQuery, results } = useCarSearch()
  const selectedCarId = useCarStore(state => state.selectedCarId)
  const selectCar = useCarStore(state => state.selectCar)

  return (
    <div className="flex flex-col gap-3">
      {/* Search input with icon */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.25" />
          <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search — Supra, Mustang…"
          className="w-full pl-9 pr-3 py-2.5 rounded-lg font-ui text-sm focus:outline-none transition-all"
          style={{
            background: 'var(--surface-3)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = 'var(--accent)'
            e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-glow)'
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        {results.length === 0 ? (
          <p className="font-ui text-sm py-2" style={{ color: 'var(--text-tertiary)' }}>
            No vehicles found matching &ldquo;{query}&rdquo;
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
