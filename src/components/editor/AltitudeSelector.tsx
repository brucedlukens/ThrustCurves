import { useCarStore } from '@/store/carStore'
import { ALTITUDE_PRESETS } from '@/data/presets'

const INPUT_CLS =
  'w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-gray-100 ' +
  'focus:outline-none focus:ring-1 focus:ring-indigo-500'

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
          aria-label="Altitude in meters"
        />
        <span className="text-gray-400 text-sm shrink-0">m</span>
      </div>
    </div>
  )
}
