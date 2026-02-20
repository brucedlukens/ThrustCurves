import { useCarStore } from '@/store/carStore'

interface ForcedInductionToggleProps {
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
        {/* Premium toggle switch */}
        <button
          role="switch"
          aria-checked={effective}
          onClick={handleToggle}
          className="relative inline-flex h-6 w-11 items-center rounded-full focus:outline-none transition-all duration-200"
          style={{
            background: effective ? 'var(--accent)' : 'var(--surface-3)',
            border: effective ? '1px solid var(--accent)' : '1px solid var(--border-bright)',
            boxShadow: effective ? '0 0 8px var(--accent-glow-strong)' : undefined,
          }}
        >
          <span
            className="inline-block h-4 w-4 rounded-full transition-transform duration-200"
            style={{
              background: effective ? 'var(--bg)' : 'var(--text-tertiary)',
              transform: effective ? 'translateX(26px)' : 'translateX(3px)',
            }}
          />
        </button>

        <div className="flex flex-col gap-0">
          <span
            className="font-ui text-xs font-semibold tracking-widest uppercase"
            style={{ color: 'var(--text-secondary)' }}
          >
            Forced Induction
          </span>
          <span
            className="font-data text-xs"
            style={{ color: effective ? 'var(--accent-text)' : 'var(--text-tertiary)' }}
          >
            {effective ? 'ACTIVE' : 'STOCK'}
          </span>
        </div>
      </div>

      {isOverridden && (
        <button
          onClick={handleReset}
          className="font-ui text-xs transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)' }}
          aria-label="Reset forced induction to stock"
        >
          Reset
        </button>
      )}
    </div>
  )
}
