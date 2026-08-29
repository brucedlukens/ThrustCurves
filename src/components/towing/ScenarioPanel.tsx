import { TRAILER_PRESETS } from '@/data/trailers'
import { useUnitStore } from '@/store/unitStore'
import { kgToLb, lbToKg, msToMph, mphToMs, msToKmh, mToFt } from '@/utils/units'
import { fmtMass } from './format'

export interface ScenarioState {
  trailerPresetId: string
  trailerMassKg: number
  cargoMassKg: number
  altitudeM: number
  gradePercent: number
  speedMs: number
}

interface ScenarioPanelProps {
  scenario: ScenarioState
  onChange: (patch: Partial<ScenarioState>) => void
}

interface FieldProps {
  label: string
  children: React.ReactNode
}

function Field({ label, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-display text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-txt">
        {label}
      </label>
      {children}
    </div>
  )
}

const INPUT_CLASS =
  'w-full px-3 py-2 rounded-lg border border-line bg-lift font-data text-sm text-data text-right tabular-nums focus:outline-none focus:border-signal/60 transition-colors'

interface ChipProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}

function Chip({ active, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2 py-0.5 rounded font-data text-[10px] transition-colors ${
        active
          ? 'bg-signal-dim text-signal-hi border border-signal/60'
          : 'bg-lift text-muted-txt border border-line hover:text-gray-300'
      }`}
    >
      {children}
    </button>
  )
}

const ALTITUDE_CHIPS_FT = [0, 5000, 8000, 11000]
const GRADE_CHIPS = [0, 3, 6, 8]
const SPEED_CHIPS_MPH = [55, 65, 75]

export default function ScenarioPanel({ scenario, onChange }: ScenarioPanelProps) {
  const units = useUnitStore(state => state.units)
  const imperial = units === 'imperial'
  const preset = TRAILER_PRESETS.find(p => p.id === scenario.trailerPresetId)

  const selectPreset = (id: string) => {
    const next = TRAILER_PRESETS.find(p => p.id === id)
    if (!next) return
    onChange({ trailerPresetId: id, trailerMassKg: next.defaultMassKg })
  }

  const massDisplay = (kg: number) => Math.round(imperial ? kgToLb(kg) : kg)
  const massFromDisplay = (v: number) => (imperial ? lbToKg(v) : v)

  return (
    <div className="flex flex-col gap-4">
      <Field label="Trailer">
        <select
          value={scenario.trailerPresetId}
          aria-label="Trailer preset"
          onChange={e => selectPreset(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-line bg-lift font-data text-sm text-data focus:outline-none focus:border-signal/60 transition-colors"
        >
          {TRAILER_PRESETS.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {preset && (
          <p className="font-data text-[10px] text-muted-txt leading-snug">
            {preset.description} · typical {fmtMass(preset.massRangeKg[0], units)}–
            {fmtMass(preset.massRangeKg[1], units)}
          </p>
        )}
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={`Trailer weight (${imperial ? 'lb' : 'kg'})`}>
          <input
            type="number"
            min={0}
            step={imperial ? 100 : 50}
            value={massDisplay(scenario.trailerMassKg)}
            onChange={e => onChange({ trailerMassKg: Math.max(0, massFromDisplay(Number(e.target.value))) })}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label={`Truck cargo (${imperial ? 'lb' : 'kg'})`}>
          <input
            type="number"
            min={0}
            step={imperial ? 50 : 25}
            value={massDisplay(scenario.cargoMassKg)}
            onChange={e => onChange({ cargoMassKg: Math.max(0, massFromDisplay(Number(e.target.value))) })}
            className={INPUT_CLASS}
          />
        </Field>
      </div>

      <Field label={`Altitude (${imperial ? 'ft' : 'm'})`}>
        <input
          type="number"
          min={0}
          step={imperial ? 500 : 100}
          value={Math.round(imperial ? mToFt(scenario.altitudeM) : scenario.altitudeM)}
          onChange={e => {
            const v = Math.max(0, Number(e.target.value))
            onChange({ altitudeM: imperial ? v / 3.28084 : v })
          }}
          className={INPUT_CLASS}
        />
        <div className="flex gap-1.5 flex-wrap">
          {ALTITUDE_CHIPS_FT.map(ft => (
            <Chip
              key={ft}
              active={Math.abs(scenario.altitudeM - ft / 3.28084) < 1}
              onClick={() => onChange({ altitudeM: ft / 3.28084 })}
            >
              {imperial ? `${ft.toLocaleString()} ft` : `${Math.round(ft / 3.28084)} m`}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="Grade (%)">
        <input
          type="number"
          step={0.5}
          value={scenario.gradePercent}
          onChange={e => onChange({ gradePercent: Number(e.target.value) })}
          className={INPUT_CLASS}
        />
        <div className="flex gap-1.5 flex-wrap">
          {GRADE_CHIPS.map(g => (
            <Chip
              key={g}
              active={scenario.gradePercent === g}
              onClick={() => onChange({ gradePercent: g })}
            >
              {g === 0 ? 'Flat' : `${g}%`}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label={`Speed (${imperial ? 'mph' : 'km/h'})`}>
        <input
          type="number"
          min={1}
          value={Math.round(imperial ? msToMph(scenario.speedMs) : msToKmh(scenario.speedMs))}
          onChange={e => {
            const v = Math.max(1, Number(e.target.value))
            onChange({ speedMs: imperial ? mphToMs(v) : v / 3.6 })
          }}
          className={INPUT_CLASS}
        />
        <div className="flex gap-1.5 flex-wrap">
          {SPEED_CHIPS_MPH.map(mph => (
            <Chip
              key={mph}
              active={Math.abs(scenario.speedMs - mphToMs(mph)) < 0.05}
              onClick={() => onChange({ speedMs: mphToMs(mph) })}
            >
              {imperial ? `${mph} mph` : `${Math.round(mphToMs(mph) * 3.6)} km/h`}
            </Chip>
          ))}
        </div>
      </Field>
    </div>
  )
}
