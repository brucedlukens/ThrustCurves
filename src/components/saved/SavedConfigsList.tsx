import type { SavedSetup } from '@/types/config'
import type { CarSpec } from '@/types/car'

interface SavedConfigsListProps {
  setups: SavedSetup[]
  cars: CarSpec[]
  /** IDs of setups currently selected for comparison */
  selectedIds?: string[]
  onLoad?: (setup: SavedSetup) => void
  onDelete?: (id: string) => void
  onToggleCompare?: (id: string) => void
}

export default function SavedConfigsList({
  setups,
  cars,
  selectedIds = [],
  onLoad,
  onDelete,
  onToggleCompare,
}: SavedConfigsListProps) {
  if (setups.length === 0) {
    return (
      <p className="text-gray-500 text-sm">
        No saved setups yet. Use the Simulator to save a configuration.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {setups.map(setup => {
        const car = cars.find(c => c.id === setup.carId)
        const carLabel = car
          ? `${car.year} ${car.make} ${car.model}`
          : `Unknown car (${setup.carId})`
        const isSelected = selectedIds.includes(setup.id)
        const date = new Date(setup.createdAt).toLocaleDateString()

        return (
          <div
            key={setup.id}
            className={`rounded-lg border p-3 flex flex-col gap-1 transition-colors ${
              isSelected
                ? 'border-indigo-500 bg-indigo-900/20'
                : 'border-gray-700 bg-gray-800/50'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-medium text-gray-100 truncate">{setup.name}</span>
                <span className="text-xs text-gray-400">{carLabel}</span>
                <span className="text-xs text-gray-600">{date}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {onToggleCompare && (
                  <button
                    onClick={() => onToggleCompare(setup.id)}
                    className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                      isSelected
                        ? 'border-indigo-500 text-indigo-300 bg-indigo-900/30'
                        : 'border-gray-600 text-gray-400 hover:border-indigo-500 hover:text-indigo-300'
                    }`}
                    aria-label={isSelected ? 'Remove from comparison' : 'Add to comparison'}
                  >
                    {isSelected ? '✓ Compare' : '+ Compare'}
                  </button>
                )}
                {onLoad && (
                  <button
                    onClick={() => onLoad(setup)}
                    className="text-xs px-2 py-0.5 rounded border border-gray-600 text-gray-400 hover:border-gray-400 hover:text-gray-200 transition-colors"
                    aria-label={`Load ${setup.name}`}
                  >
                    Load
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(setup.id)}
                    className="text-xs px-2 py-0.5 rounded border border-gray-700 text-gray-500 hover:border-red-600 hover:text-red-400 transition-colors"
                    aria-label={`Delete ${setup.name}`}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
