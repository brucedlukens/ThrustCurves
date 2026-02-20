import { useCarStore } from '@/store/carStore'

const INPUT_CLS =
  'w-full bg-lift border border-line rounded px-2 py-1.5 text-sm text-gray-100 font-data ' +
  'focus:outline-none focus:ring-1 focus:ring-signal focus:border-signal transition-colors'

interface TractionPreset {
  name: string
  mu: number | undefined
  description: string
}

const PRESETS: TractionPreset[] = [
  { name: 'Unlimited', mu: undefined, description: 'No traction limit (default)' },
  { name: 'Drag Slick', mu: 1.7, description: 'Competition drag tire (μ = 1.7)' },
  { name: 'Track', mu: 1.4, description: 'Performance track tire (μ = 1.4)' },
  { name: 'Street', mu: 1.0, description: 'Street performance tire (μ = 1.0)' },
  { name: 'Eco', mu: 0.7, description: 'Economy / all-season tire (μ = 0.7)' },
]

export default function TractionEditor() {
  const mu = useCarStore(state => state.modifications.tractionCoefficientMu)
  const updateModifications = useCarStore(state => state.updateModifications)

  const matchedPreset = mu === undefined
    ? PRESETS[0]
    : PRESETS.find(p => p.mu !== undefined && Math.abs(p.mu - mu) < 0.001)

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    if (val === 'unlimited') {
      updateModifications({ tractionCoefficientMu: undefined })
    } else {
      const parsed = parseFloat(val)
      if (!isNaN(parsed)) updateModifications({ tractionCoefficientMu: parsed })
    }
  }

  const handleCustomInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    if (!isNaN(val) && val > 0) {
      updateModifications({ tractionCoefficientMu: val })
    }
  }

  const selectValue = mu === undefined
    ? 'unlimited'
    : matchedPreset?.mu !== undefined
    ? String(matchedPreset.mu)
    : 'custom'

  return (
    <div className="flex flex-col gap-2">
      <select
        value={selectValue}
        onChange={handlePresetChange}
        className={INPUT_CLS}
        aria-label="Traction limit preset"
      >
        {PRESETS.map(p => (
          <option key={p.name} value={p.mu === undefined ? 'unlimited' : String(p.mu)}>
            {p.name} — {p.description}
          </option>
        ))}
        {!matchedPreset && mu !== undefined && (
          <option value="custom">Custom (μ = {mu})</option>
        )}
      </select>

      {mu !== undefined && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={mu}
            onChange={handleCustomInput}
            min={0.1}
            max={3.0}
            step={0.1}
            className={INPUT_CLS}
            aria-label="Traction coefficient mu"
          />
          <span className="font-data text-xs text-label shrink-0">μ</span>
        </div>
      )}

      {mu !== undefined && (
        <p className="font-data text-[10px] text-muted-txt">
          Max thrust capped at μ × weight × g
        </p>
      )}
    </div>
  )
}
