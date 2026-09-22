import { useEffect, useState } from 'react'
import { useCarStore } from '@/store/carStore'
import { useUnitStore } from '@/store/unitStore'
import { DEFAULT_DRIVER_MASS_KG } from '@/data/presets'
import { kgToLb, lbToKg } from '@/utils/units'

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
  const units = useUnitStore(state => state.units)
  const imperial = units === 'imperial'
  const unit = imperial ? 'lb' : 'kg'

  // Inputs are typed in the display unit; the store is always kg
  const toDisplay = (kg: number) => (imperial ? kgToLb(kg) : kg)
  const toKg = (v: number) => (imperial ? lbToKg(v) : v)
  const fmt = (kg: number) => toDisplay(kg).toFixed(0)
  const rawFor = (kg: number) => String(parseFloat(toDisplay(kg).toFixed(1)))

  const [rawDriver, setRawDriver] = useState(() => rawFor(driverMassKg))
  const [rawValue, setRawValue] = useState(() => rawFor(weightDeltaKg))

  useEffect(() => {
    setRawDriver(rawFor(driverMassKg))
    setRawValue(rawFor(weightDeltaKg))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverMassKg, weightDeltaKg, imperial])

  const handleDriverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRawDriver(e.target.value)
    const val = parseFloat(e.target.value)
    if (!isNaN(val) && val >= 0) {
      updateModifications({ driverMassKg: toKg(val) })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRawValue(e.target.value)
    const val = parseFloat(e.target.value)
    if (!isNaN(val)) {
      updateModifications({ weightDeltaKg: toKg(val) })
    }
  }

  const handleBlur = () => {
    setRawValue(rawFor(weightDeltaKg))
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
          aria-label={`Weight delta in ${unit}`}
        />
        <span className="font-data text-xs text-label shrink-0">{unit}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-data text-[11px] text-label shrink-0 w-14">Driver</span>
        <input
          type="number"
          value={rawDriver}
          onChange={handleDriverChange}
          onBlur={() => setRawDriver(rawFor(driverMassKg))}
          min={0}
          step={5}
          className={INPUT_CLS}
          aria-label={`Driver mass in ${unit}`}
        />
        <span className="font-data text-xs text-label shrink-0">{unit}</span>
      </div>
      <p className="font-data text-[11px] text-muted-txt">
        Stock {fmt(stockWeightKg)} {unit} + driver {fmt(driverMassKg)} {unit}
        {weightDeltaKg !== 0 ? ` ${weightDeltaKg > 0 ? '+' : '−'} ${fmt(Math.abs(weightDeltaKg))} ${unit}` : ''} → Simulated: {fmt(effectiveWeight)} {unit}
      </p>
    </div>
  )
}
