import { useTelemetryStore } from '@/store/telemetryStore'
import type { GripEnvelope, WhatIfOptions } from '@/types/telemetry'
import { INPUT_CLS, LABEL_CLS } from './shared'

interface AnalysisOptionsProps {
  /** Envelope as measured from the log (before overrides), for placeholders */
  measured: GripEnvelope | null
  hasRpm: boolean
  hasLatAccel: boolean
}

export default function AnalysisOptions({ measured, hasRpm, hasLatAccel }: AnalysisOptionsProps) {
  const options = useTelemetryStore(state => state.options)
  const setOptions = useTelemetryStore(state => state.setOptions)
  const overrides = useTelemetryStore(state => state.envelopeOverrides)
  const setEnvelopeOverride = useTelemetryStore(state => state.setEnvelopeOverride)

  const toggle = (key: keyof WhatIfOptions, label: string, hint: string) => (
    <label className="flex items-start gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={options[key] as boolean}
        onChange={e => setOptions({ [key]: e.target.checked })}
        className="mt-0.5 accent-[#dc2626]"
        aria-label={label}
      />
      <span className="flex flex-col">
        <span className="font-data text-xs text-gray-200">{label}</span>
        <span className="font-data text-[10px] text-muted-txt leading-snug">{hint}</span>
      </span>
    </label>
  )

  const gField = (key: keyof GripEnvelope, label: string, note?: string) => (
    <div className="flex flex-col gap-1">
      <span className={LABEL_CLS}>{label}</span>
      <input
        type="number"
        step={0.05}
        min={0.1}
        max={3}
        value={overrides[key] ?? ''}
        placeholder={measured ? measured[key].toFixed(2) : '—'}
        onChange={e => setEnvelopeOverride(key, e.target.value === '' ? undefined : parseFloat(e.target.value))}
        className={INPUT_CLS}
        aria-label={label}
      />
      {note && <span className="font-data text-[10px] text-muted-txt leading-snug">{note}</span>}
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      {toggle('calibrate', 'Calibrate model to log', 'Scale modeled thrust so the baseline matches what the car actually delivered')}
      {toggle('scaleGripWithMass', 'Scale grip with weight change', 'Lighter car keeps its g; heavier car loses some')}

      <div className="flex flex-col gap-1">
        <span className={LABEL_CLS}>Gear strategy</span>
        <select
          value={options.gearStrategy}
          onChange={e => setOptions({ gearStrategy: e.target.value as WhatIfOptions['gearStrategy'] })}
          className={INPUT_CLS}
          aria-label="Gear strategy"
        >
          <option value="optimal">Optimal shifts (thrust envelope)</option>
          <option value="hold" disabled={!hasRpm}>
            Hold logged gear{hasRpm ? '' : ' (needs RPM channel)'}
          </option>
        </select>
      </div>

      <div className="pt-2 border-t border-faint">
        <span className={LABEL_CLS}>Grip limits (g) — blank = measured</span>
        <div className="grid grid-cols-3 gap-2 mt-1.5">
          {gField('maxLatG', 'Lateral', hasLatAccel ? undefined : 'no lateral channel; 1.0 assumed')}
          {gField('maxAccelG', 'Traction', 'max(observed, 0.6 × lateral)')}
          {gField('maxBrakeG', 'Braking')}
        </div>
      </div>
    </div>
  )
}
