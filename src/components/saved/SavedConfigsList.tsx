import type { SavedSetup } from '@/types/config'
import type { CarSpec } from '@/types/car'

interface SavedConfigsListProps {
  setups: SavedSetup[]
  cars: CarSpec[]
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
      <p className="font-data text-sm text-muted-txt py-4">
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
          : `Unknown (${setup.carId})`
        const isSelected = selectedIds.includes(setup.id)
        const date = new Date(setup.createdAt).toLocaleDateString()

        return (
          <div
            key={setup.id}
            className={[
              'rounded-lg border p-3 flex flex-col gap-2 transition-all',
              isSelected
                ? 'border-signal/50 bg-signal-dim shadow-[0_0_12px_rgba(220,38,38,0.1)]'
                : 'border-line bg-lift hover:border-gray-600',
            ].join(' ')}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-display text-sm font-semibold text-gray-100 truncate tracking-wide">
                  {setup.name}
                </span>
                <span className="font-data text-xs text-label truncate">{carLabel}</span>
                <span className="font-data text-[10px] text-muted-txt">{date}</span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                {onToggleCompare && (
                  <button
                    onClick={() => onToggleCompare(setup.id)}
                    className={[
                      'font-display text-[10px] font-semibold tracking-wider uppercase px-2 py-1 rounded border transition-all',
                      isSelected
                        ? 'border-signal/50 text-signal-hi bg-signal-dim'
                        : 'border-line text-label hover:border-signal/50 hover:text-signal-hi',
                    ].join(' ')}
                    aria-label={isSelected ? 'Remove from comparison' : 'Add to comparison'}
                  >
                    {isSelected ? '✓ Compare' : '+ Compare'}
                  </button>
                )}
                {onLoad && (
                  <button
                    onClick={() => onLoad(setup)}
                    className="font-display text-[10px] font-semibold tracking-wider uppercase px-2 py-1 rounded border border-line text-label hover:border-gray-400 hover:text-gray-200 transition-all"
                    aria-label={`Load ${setup.name}`}
                  >
                    Load
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(setup.id)}
                    className="font-display text-[10px] font-semibold tracking-wider uppercase px-2 py-1 rounded border border-faint text-muted-txt hover:border-signal/50 hover:text-signal-hi transition-all"
                    aria-label={`Delete ${setup.name}`}
                  >
                    Del
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
