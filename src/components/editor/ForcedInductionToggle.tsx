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
          type="button"
          role="switch"
          aria-checked={effective}
          onClick={handleToggle}
          className={[
            'relative inline-flex h-6 w-11 items-center rounded-full',
            'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-signal/50 focus:ring-offset-1 focus:ring-offset-panel',
            effective ? 'bg-signal' : 'bg-lift border border-line',
          ].join(' ')}
        >
          <span
            className={[
              'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200',
              effective ? 'translate-x-6' : 'translate-x-1',
            ].join(' ')}
          />
        </button>

        <div className="flex flex-col gap-0.5">
          <span className="font-display text-[11px] font-semibold tracking-[0.15em] uppercase text-gray-300">
            {effective ? 'Forced Induction' : 'Naturally Aspirated'}
          </span>
          <span className="font-data text-[10px] text-muted-txt">
            {effective ? 'Turbo / Supercharged' : 'No boost'}
          </span>
        </div>
      </div>

      {isOverridden && (
        <button
          onClick={handleReset}
          className="text-xs text-muted-txt hover:text-gray-300 underline underline-offset-2 transition-colors"
          aria-label="Reset forced induction to stock"
        >
          Reset
        </button>
      )}
    </div>
  )
}
