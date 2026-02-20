import { useCarStore } from '@/store/carStore'
import { ALTITUDE_PRESETS } from '@/data/presets'

const INPUT_CLS =
  'w-full bg-[--color-surface-2] border border-[--color-border] rounded px-2 py-1.5 text-sm ' +
  'text-[--color-text-1] focus:outline-none focus:ring-1 focus:ring-amber-500/50 ' +
  'focus:border-[--color-border-2]'

const MONO_STYLE = { fontFamily: 'var(--font-mono)' }

export default function AltitudeSelector() {
  const altitudeM = useCarStore(state => state.modifications.altitudeM)
  const updateModifications = useCarStore(state => state.updateModifications)

  const matchedPreset = ALTITUDE_PRESETS.find(p => p.altitudeM === altitudeM)

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = Number(e.target.value)
    updateModifications({ altitudeM: val })
  }

  const handleAltitudeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value)
    if (!isNaN(val) && val >= 0) {
      updateModifications({ altitudeM: val })
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <select
        value={matchedPreset ? String(altitudeM) : 'custom'}
        onChange={handlePresetChange}
        className={INPUT_CLS}
        style={MONO_STYLE}
        aria-label="Altitude preset"
      >
        {ALTITUDE_PRESETS.map(preset => (
          <option key={preset.name} value={String(preset.altitudeM)}>
            {preset.name} ({preset.altitudeM} m)
          </option>
        ))}
        {!matchedPreset && <option value="custom">Custom</option>}
      </select>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={altitudeM}
          onChange={handleAltitudeInput}
          min={0}
          max={8848}
          step={100}
          className={INPUT_CLS}
          style={MONO_STYLE}
          aria-label="Altitude in meters"
        />
        <span className="text-sm shrink-0" style={{ color: 'var(--color-text-2)', fontFamily: 'var(--font-mono)' }}>m</span>
      </div>
    </div>
  )
}
