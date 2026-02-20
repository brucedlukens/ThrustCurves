import { useEffect, useState } from 'react'
import { useCarStore } from '@/store/carStore'

const INPUT_CLS =
  'w-full bg-[--color-surface-2] border border-[--color-border] rounded px-2 py-1.5 text-sm ' +
  'text-[--color-text-1] focus:outline-none focus:ring-1 focus:ring-amber-500/50 ' +
  'focus:border-[--color-border-2]'

const MONO_STYLE = { fontFamily: 'var(--font-mono)' }

interface WeightEditorProps {
  /** Stock curb weight in kg (shown as reference) */
  stockWeightKg: number
}

export default function WeightEditor({ stockWeightKg }: WeightEditorProps) {
  const weightDeltaKg = useCarStore(state => state.modifications.weightDeltaKg)
  const updateModifications = useCarStore(state => state.updateModifications)

  // Local string state allows clearing/typing negatives without being overwritten by the store
  const [rawValue, setRawValue] = useState(() => String(weightDeltaKg))

  // Sync display when store changes externally (Reset All, load saved setup)
  useEffect(() => {
    setRawValue(String(weightDeltaKg))
  }, [weightDeltaKg])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRawValue(e.target.value)
    const val = parseFloat(e.target.value)
    if (!isNaN(val)) {
      updateModifications({ weightDeltaKg: val })
    }
  }

  // On blur, sync display back to the last valid store value
  const handleBlur = () => {
    setRawValue(String(weightDeltaKg))
  }

  const effectiveWeight = stockWeightKg + weightDeltaKg

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={rawValue}
          onChange={handleChange}
          onBlur={handleBlur}
          step={5}
          className={INPUT_CLS}
          style={MONO_STYLE}
          aria-label="Weight delta in kg"
        />
        <span className="text-sm shrink-0" style={{ color: 'var(--color-text-2)' }}>kg</span>
      </div>
      <p
        className="text-xs"
        style={{ color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}
      >
        Stock: {stockWeightKg} kg → Effective:{' '}
        <span style={{ color: 'var(--color-text-1)' }}>
          {effectiveWeight.toFixed(0)} kg
        </span>
      </p>
    </div>
  )
}
