import { useCarStore } from '@/store/carStore'

interface ForcedInductionToggleProps {
  /** Stock forced induction setting */
  stockForcedInduction: boolean
}

export default function ForcedInductionToggle({ stockForcedInduction }: ForcedInductionToggleProps) {
  const forcedInductionOverride = useCarStore(state => state.modifications.forcedInductionOverride)
  const updateModifications = useCarStore(state => state.updateModifications)

  // Effective value: override if set, else stock
  const effective = forcedInductionOverride !== undefined ? forcedInductionOverride : stockForcedInduction
  const isOverridden = forcedInductionOverride !== undefined

  const handleToggle = () => {
    const newValue = !effective
    // If new value equals stock, clear the override
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
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-gray-800 ${
            effective ? 'bg-indigo-600' : 'bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
              effective ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </button>
        <span className="text-sm text-gray-300">
          {effective ? 'Turbocharged / Supercharged' : 'Naturally Aspirated'}
        </span>
      </div>
      {isOverridden && (
        <button
          onClick={handleReset}
          className="text-xs text-gray-500 hover:text-gray-300 underline"
          aria-label="Reset forced induction to stock"
        >
          Reset
        </button>
      )}
    </div>
  )
}
