import { useCarStore } from '@/store/carStore'

const INPUT_CLS =
  'w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-gray-100 ' +
  'focus:outline-none focus:ring-1 focus:ring-indigo-500'

export default function TorqueCurveEditor() {
  const torqueMultiplier = useCarStore(state => state.modifications.torqueMultiplier)
  const updateModifications = useCarStore(state => state.updateModifications)

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(parseFloat(e.target.value).toFixed(2))
    updateModifications({ torqueMultiplier: val })
  }

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    if (!isNaN(val) && val > 0 && val <= 3) {
      updateModifications({ torqueMultiplier: parseFloat(val.toFixed(2)) })
    }
  }

  const pct = ((torqueMultiplier - 1) * 100).toFixed(0)
  const pctLabel = torqueMultiplier >= 1 ? `+${pct}%` : `${pct}%`

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0.5}
          max={2.0}
          step={0.01}
          value={torqueMultiplier}
          onChange={handleSlider}
          className="flex-1 accent-indigo-500"
          aria-label="Torque multiplier slider"
        />
        <span className="text-sm text-indigo-400 w-12 text-right">{pctLabel}</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={torqueMultiplier}
          onChange={handleInput}
          min={0.5}
          max={2.0}
          step={0.01}
          className={INPUT_CLS}
          aria-label="Torque multiplier"
        />
        <span className="text-gray-400 text-sm shrink-0">× stock</span>
      </div>
    </div>
  )
}
