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
      <p className="font-ui text-sm" style={{ color: 'var(--text-tertiary)' }}>
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
            className="rounded-lg p-3 flex flex-col gap-1 transition-all duration-150"
            style={{
              background: isSelected ? 'var(--surface-3)' : 'var(--surface-2)',
              border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
              boxShadow: isSelected ? '0 0 0 1px var(--accent-glow)' : undefined,
            }}
          >
            {/* Selected indicator */}
            {isSelected && (
              <div
                className="h-0.5 w-full -mt-3 mb-2 rounded-t"
                style={{ background: 'linear-gradient(90deg, var(--accent), transparent)' }}
              />
            )}

            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span
                  className="font-display text-sm font-semibold truncate"
                  style={{ color: isSelected ? 'var(--accent-text)' : 'var(--text-primary)' }}
                >
                  {setup.name}
                </span>
                <span
                  className="font-ui text-xs"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {carLabel}
                </span>
                <span
                  className="font-data text-xs"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {date}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {onToggleCompare && (
                  <button
                    onClick={() => onToggleCompare(setup.id)}
                    className="font-ui text-xs px-2 py-0.5 rounded transition-all"
                    style={{
                      border: isSelected
                        ? '1px solid var(--accent)'
                        : '1px solid var(--border-bright)',
                      color: isSelected ? 'var(--accent-text)' : 'var(--text-secondary)',
                      background: isSelected ? 'var(--accent-glow)' : 'transparent',
                    }}
                    aria-label={isSelected ? 'Remove from comparison' : 'Add to comparison'}
                  >
                    {isSelected ? '✓ In' : '+ Add'}
                  </button>
                )}
                {onLoad && (
                  <button
                    onClick={() => onLoad(setup)}
                    className="font-ui text-xs px-2 py-0.5 rounded transition-all"
                    style={{
                      border: '1px solid var(--border-bright)',
                      color: 'var(--text-secondary)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--accent-dim)'
                      e.currentTarget.style.color = 'var(--accent-text)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border-bright)'
                      e.currentTarget.style.color = 'var(--text-secondary)'
                    }}
                    aria-label={`Load ${setup.name}`}
                  >
                    Load
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(setup.id)}
                    className="font-ui text-xs px-2 py-0.5 rounded transition-all"
                    style={{
                      border: '1px solid var(--border)',
                      color: 'var(--text-tertiary)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)'
                      e.currentTarget.style.color = 'var(--danger)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border)'
                      e.currentTarget.style.color = 'var(--text-tertiary)'
                    }}
                    aria-label={`Delete ${setup.name}`}
                  >
                    ×
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
