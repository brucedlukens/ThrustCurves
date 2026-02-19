import { useCarSearch } from '@/hooks/useCarSearch'
import { useCarStore } from '@/store/carStore'
import CarCard from './CarCard'

export default function CarSearch() {
  const { query, setQuery, results } = useCarSearch()
  const selectedCarId = useCarStore(state => state.selectedCarId)
  const selectCar = useCarStore(state => state.selectCar)

  return (
    <div className="flex flex-col gap-3">
      <input
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search cars (e.g. Supra, Mustang)"
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm"
      />
      <div className="flex flex-col gap-2">
        {results.length === 0 ? (
          <p className="text-gray-500 text-sm py-2">
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
