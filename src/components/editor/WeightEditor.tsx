import { useEffect, useState } from 'react'
import { useCarStore } from '@/store/carStore'
import { DEFAULT_DRIVER_MASS_KG } from '@/data/presets'

const INPUT_CLS =
  'w-full bg-lift border border-line rounded px-2 py-1.5 text-sm text-gray-100 font-data ' +
  'focus:outline-none focus:ring-1 focus:ring-signal focus:border-signal transition-colors placeholder:text-muted-txt'

interface WeightEditorProps {
  stockWeightKg: number
}

export default function WeightEditor({ stockWeightKg }: WeightEditorProps) {
  const weightDeltaKg = useCarStore(state => state.modifications.weightDeltaKg)
  const driverMassKg = useCarStore(state => state.modifications.driverMassKg ?? DEFAULT_DRIVER_MASS_KG)
  const updateModifications = useCarStore(state => state.updateModifications)
  const [rawDriver, setRawDriver] = useState(() => String(driverMassKg))

  useEffect(() => {
    setRawDriver(String(driverMassKg))
  }, [driverMassKg])

  const handleDriverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRawDriver(e.target.value)
    const val = parseFloat(e.target.value)
    if (!isNaN(val) && val >= 0) {
      updateModifications({ driverMassKg: val })
    }
  }

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

  const effectiveWeight = stockWeightKg + driverMassKg + weightDeltaKg

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
      <div className="flex items-center gap-2">
        <span className="font-data text-[11px] text-label shrink-0 w-14">Driver</span>
        <input
          type="number"
          value={rawDriver}
          onChange={handleDriverChange}
          onBlur={() => setRawDriver(String(driverMassKg))}
          min={0}
          step={5}
          className={INPUT_CLS}
          aria-label="Driver mass in kg"
        />
        <span className="font-data text-xs text-label shrink-0">kg</span>
      </div>
      <p className="font-data text-[11px] text-muted-txt">
        Stock {stockWeightKg} kg + driver {driverMassKg.toFixed(0)} kg{weightDeltaKg !== 0 ? ` ${weightDeltaKg > 0 ? '+' : '−'} ${Math.abs(weightDeltaKg)} kg` : ''} → Simulated: {effectiveWeight.toFixed(0)} kg
      </p>
    </div>
  )
}
