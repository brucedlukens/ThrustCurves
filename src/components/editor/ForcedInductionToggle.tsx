import { useCarStore } from '@/store/carStore'

interface ForcedInductionToggleProps {
  /** Stock forced induction setting */
  stockForcedInduction: boolean
}

export default function ForcedInductionToggle({ stockForcedInduction }: ForcedInductionToggleProps) {
  const forcedInductionOverride = useCarStore(state => state.modifications.forcedInductionOverride)
  const updateModifications = useCarStore(state => state.updateModifications)

  const effective = forcedInductionOverride !== undefined ? forcedInductionOverride : stockForcedInduction
  const isOverridden = forcedInductionOverride !== undefined

  const handleToggle = () => {
    const newValue = !effective
    if (newValue === stockForcedInduction) {
      updateModifications({ forcedInductionOverride: undefined })
    } else {
      updateModifications({ forcedInductionOverride: newValue })
    }
  }

  const handleReset = () => {
    updateModifications({ forcedInductionOverride: undefined })
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          role="switch"
          aria-checked={effective}
          onClick={handleToggle}
          className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1"
          style={{
            backgroundColor: effective ? 'var(--color-accent)' : 'var(--color-surface-2)',
            border: effective ? 'none' : '1px solid var(--color-border-2)',
            focusRingColor: 'var(--color-accent)',
            focusRingOffsetColor: 'var(--color-bg)',
          } as React.CSSProperties}
        >
          <span
            className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
            style={{ transform: effective ? 'translateX(1.4rem)' : 'translateX(0.2rem)' }}
          />
        </button>
        <span
          className="text-sm"
          style={{ fontFamily: 'var(--font-ui)', color: 'var(--color-text-1)' }}
        >
          {effective ? 'Turbocharged / Supercharged' : 'Naturally Aspirated'}
        </span>
        {!isOverridden && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider"
            style={{
              fontFamily: 'var(--font-display)',
              backgroundColor: 'var(--color-surface-2)',
              color: 'var(--color-text-3)',
            }}
          >
            Stock
          </span>
        )}
      </div>
      {isOverridden && (
        <button
          onClick={handleReset}
          className="text-xs underline"
          style={{ color: 'var(--color-text-3)' }}
          aria-label="Reset forced induction to stock"
        >
          Reset
        </button>
      )}
    </div>
  )
}
