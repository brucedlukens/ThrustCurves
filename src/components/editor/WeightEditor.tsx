import { useEffect, useState } from 'react'
import { useCarStore } from '@/store/carStore'

const INPUT_CLS =
  'w-full bg-lift border border-line rounded px-2 py-1.5 text-sm text-gray-100 font-data ' +
  'focus:outline-none focus:ring-1 focus:ring-signal focus:border-signal transition-colors placeholder:text-muted-txt'

interface WeightEditorProps {
  stockWeightKg: number
}

export default function WeightEditor({ stockWeightKg }: WeightEditorProps) {
  const weightDeltaKg = useCarStore(state => state.modifications.weightDeltaKg)
  const updateModifications = useCarStore(state => state.updateModifications)

  const [rawValue, setRawValue] = useState(() => String(weightDeltaKg))

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
        <span className="font-data text-xs text-label shrink-0">kg</span>
      </div>
      <p className="font-data text-[11px] text-muted-txt">
        Stock <span className="text-label">{stockWeightKg}</span> kg
        {' → '}
        Eff. <span className={effectiveWeight < stockWeightKg ? 'text-green-400' : effectiveWeight > stockWeightKg ? 'text-signal-hi' : 'text-label'}>{effectiveWeight.toFixed(0)}</span> kg
      </p>
    </div>
  )
}
