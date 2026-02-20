import { useEffect, useState } from 'react'
import { useCarStore } from '@/store/carStore'

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
  const deltaColor = weightDeltaKg > 0 ? 'var(--warning)' : weightDeltaKg < 0 ? 'var(--success)' : 'var(--text-tertiary)'

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={rawValue}
          onChange={handleChange}
          onBlur={handleBlur}
          step={5}
          className="flex-1 font-data text-sm px-2.5 py-1.5 rounded focus:outline-none transition-all"
          style={{
            background: 'var(--surface-3)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = 'var(--accent)'
          }}
          onBlurCapture={e => {
            e.currentTarget.style.borderColor = 'var(--border)'
          }}
          aria-label="Weight delta in kg"
        />
        <span
          className="font-data text-sm shrink-0"
          style={{ color: 'var(--text-secondary)' }}
        >
          kg
        </span>
      </div>
      <p className="font-data text-xs" style={{ color: 'var(--text-tertiary)' }}>
        Stock {stockWeightKg} kg{' '}
        <span style={{ color: deltaColor }}>
          {weightDeltaKg >= 0 ? '+' : ''}{weightDeltaKg}
        </span>
        {' '}→{' '}
        <span style={{ color: 'var(--text-secondary)' }}>
          {effectiveWeight.toFixed(0)} kg
        </span>
      </p>
    </div>
  )
}
