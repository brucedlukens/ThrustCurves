import { useEffect, useState } from 'react'
import { useCarStore } from '@/store/carStore'

const INPUT_CLS =
  'w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-gray-100 ' +
  'focus:outline-none focus:ring-1 focus:ring-indigo-500'

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
          aria-label="Weight delta in kg"
        />
        <span className="text-gray-400 text-sm shrink-0">kg</span>
      </div>
      <p className="text-xs text-gray-500">
        Stock: {stockWeightKg} kg → Effective: {effectiveWeight.toFixed(0)} kg
      </p>
    </div>
  )
}
