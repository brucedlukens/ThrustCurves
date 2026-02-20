import { useCarSearch } from '@/hooks/useCarSearch'
import { useCarStore } from '@/store/carStore'
import CarCard from './CarCard'

export default function CarSearch() {
  const { query, setQuery, results } = useCarSearch()
  const selectedCarId = useCarStore(state => state.selectedCarId)
  const selectCar = useCarStore(state => state.selectCar)

  return (
    <div className="flex flex-col gap-2">
      {/* Search input — command-palette style */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-label pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search — Supra, Mustang, Civic…"
          className="w-full pl-9 pr-3 py-2.5 bg-lift border border-line rounded-lg text-gray-100 text-sm placeholder:text-muted-txt focus:outline-none focus:border-signal focus:ring-1 focus:ring-signal/40 transition-colors font-data"
        />
      </div>

      {/* Results list */}
      <div className="flex flex-col gap-1.5">
        {results.length === 0 ? (
          <p className="text-muted-txt text-sm py-3 px-1 font-data">
            No results for &ldquo;{query}&rdquo;
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
