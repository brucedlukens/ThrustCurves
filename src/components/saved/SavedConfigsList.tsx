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
      <p className="text-sm" style={{ color: 'var(--color-text-3)', fontFamily: 'var(--font-ui)' }}>
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
            className="rounded-lg p-3 flex flex-col gap-1 transition-colors"
            style={{
              border: isSelected ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
              borderLeft: isSelected ? '2px solid var(--color-accent)' : '2px solid transparent',
              backgroundColor: isSelected ? 'var(--color-accent-dim)' : 'var(--color-surface)',
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span
                  className="text-sm font-medium truncate"
                  style={{ fontFamily: 'var(--font-ui)', color: 'var(--color-text-1)' }}
                >
                  {setup.name}
                </span>
                <span
                  className="text-xs"
                  style={{ fontFamily: 'var(--font-ui)', color: 'var(--color-text-2)' }}
                >
                  {carLabel}
                </span>
                <span
                  className="text-[10px]"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)' }}
                >
                  {date}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {onToggleCompare && (
                  <button
                    onClick={() => onToggleCompare(setup.id)}
                    className="text-[10px] px-2 py-0.5 rounded transition-colors uppercase tracking-wider"
                    style={{
                      fontFamily: 'var(--font-display)',
                      border: isSelected ? '1px solid var(--color-accent)' : '1px solid var(--color-border-2)',
                      color: isSelected ? 'var(--color-accent)' : 'var(--color-text-3)',
                      backgroundColor: isSelected ? 'var(--color-accent-dim)' : 'transparent',
                    }}
                    aria-label={isSelected ? 'Remove from comparison' : 'Add to comparison'}
                  >
                    {isSelected ? '✓ Compare' : '+ Compare'}
                  </button>
                )}
                {onLoad && (
                  <button
                    onClick={() => onLoad(setup)}
                    className="text-[10px] px-2 py-0.5 rounded transition-colors uppercase tracking-wider"
                    style={{
                      fontFamily: 'var(--font-display)',
                      border: '1px solid var(--color-border-2)',
                      color: 'var(--color-text-2)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-text-1)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-2)' }}
                    aria-label={`Load ${setup.name}`}
                  >
                    Load
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(setup.id)}
                    className="text-[10px] px-2 py-0.5 rounded transition-colors uppercase tracking-wider"
                    style={{
                      fontFamily: 'var(--font-display)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-3)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--color-danger)'
                      e.currentTarget.style.color = 'var(--color-danger)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--color-border)'
                      e.currentTarget.style.color = 'var(--color-text-3)'
                    }}
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
