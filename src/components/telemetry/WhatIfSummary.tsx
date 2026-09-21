import type { WhatIfResult } from '@/types/telemetry'
import { useUnitStore } from '@/store/unitStore'
import { MS_TO_MPH, MS_TO_KMH } from '@/utils/units'
import { fmtDelta } from './shared'

interface WhatIfSummaryProps {
  result: WhatIfResult
  hasChange: boolean
}

export default function WhatIfSummary({ result, hasChange }: WhatIfSummaryProps) {
  const units = useUnitStore(state => state.units)
  const speedFactor = units === 'imperial' ? MS_TO_MPH : MS_TO_KMH
  const speedUnit = units === 'imperial' ? 'mph' : 'km/h'
  const metrics = [
    { label: 'Run Δ', value: hasChange ? fmtDelta(result.totalDeltaS) : '—', accent: hasChange && result.totalDeltaS < 0 },
    { label: 'Baseline time', value: `${result.totalBaselineTimeS.toFixed(2)}s` },
    { label: 'Modified time', value: hasChange ? `${result.totalModifiedTimeS.toFixed(2)}s` : '—' },
    { label: 'Power-limited', value: `${(result.powerLimitedFraction * 100).toFixed(0)}%` },
    { label: 'Calibration', value: `×${result.calibrationFactor.toFixed(2)}` },
    { label: `Fit rms (${speedUnit})`, value: (result.baselineFitRmsMs * speedFactor).toFixed(1) },
  ]

  return (
    <div className="rounded-xl border border-line bg-panel p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full bg-signal" />
          <span className="font-display text-[11px] font-semibold tracking-[0.2em] uppercase text-label">
            What-If Result
          </span>
        </div>
        <span className="font-data text-[10px] text-muted-txt">
          grip {result.envelope.maxLatG.toFixed(2)}g · traction {result.envelope.maxAccelG.toFixed(2)}g · brake {result.envelope.maxBrakeG.toFixed(2)}g
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map(({ label, value, accent }) => (
          <div key={label} className="flex flex-col gap-1">
            <span className="font-display text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-txt">{label}</span>
            <span className={`font-data text-2xl font-semibold leading-none tabular-nums ${accent ? 'text-green-400' : 'text-data'}`}>{value}</span>
            <div className="h-px w-8 bg-signal/40 rounded-full" />
          </div>
        ))}
      </div>
      <p className="font-data text-[10px] text-muted-txt mt-4 leading-snug">
        Only power-limited stretches are re-simulated. Corner speeds, braking points and the driven line stay as logged,
        so deltas are a floor: a faster car would also open up its line where headroom exists.
      </p>
    </div>
  )
}
