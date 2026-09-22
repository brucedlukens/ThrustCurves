import { useCarStore } from '@/store/carStore'
import { useUnitStore } from '@/store/unitStore'
import { ALTITUDE_PRESETS } from '@/data/presets'
import { ftToM, mToFt } from '@/utils/units'

const INPUT_CLS =
  'w-full bg-lift border border-line rounded px-2 py-1.5 text-sm text-gray-100 font-data ' +
  'focus:outline-none focus:ring-1 focus:ring-signal focus:border-signal transition-colors'

export default function AltitudeSelector() {
  const altitudeM = useCarStore(state => state.modifications.altitudeM)
  const updateModifications = useCarStore(state => state.updateModifications)
  const units = useUnitStore(state => state.units)
  const imperial = units === 'imperial'
  const unit = imperial ? 'ft' : 'm'
  const display = (m: number) => Math.round(imperial ? mToFt(m) : m)

  const matchedPreset = ALTITUDE_PRESETS.find(p => p.altitudeM === altitudeM)

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = Number(e.target.value)
    updateModifications({ altitudeM: val })
  }

  const handleAltitudeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value)
    if (!isNaN(val) && val >= 0) {
      updateModifications({ altitudeM: imperial ? ftToM(val) : val })
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
            {preset.name} ({display(preset.altitudeM).toLocaleString()} {unit})
          </option>
        ))}
        {!matchedPreset && <option value="custom">Custom</option>}
      </select>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={display(altitudeM)}
          onChange={handleAltitudeInput}
          min={0}
          max={imperial ? 29032 : 8848}
          step={imperial ? 250 : 100}
          className={INPUT_CLS}
          aria-label={imperial ? 'Altitude in feet' : 'Altitude in meters'}
        />
        <span className="font-data text-xs text-label shrink-0">{unit}</span>
      </div>
    </div>
  )
}
