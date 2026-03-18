import { useState, useMemo } from 'react'
import { useUnitStore } from '@/store/unitStore'
import { wheelRateNPerM, suspensionFrequencyHz, frequencyRatio } from '@/engine/suspension'
import { lbPerInToNPerM, nPerMmToNPerM } from '@/utils/units'

const INPUT_CLS =
  'w-full bg-lift border border-line rounded px-2 py-1.5 text-sm text-gray-100 font-data ' +
  'focus:outline-none focus:ring-1 focus:ring-signal focus:border-signal transition-colors placeholder:text-muted-txt'

interface SuspensionFrequencyCardProps {
  totalWeightKg: number
}

interface CornerWeights {
  lf: number
  rf: number
  lr: number
  rr: number
}

function ratingColor(ratio: number): string {
  if (ratio >= 1.10 && ratio <= 1.20) return 'text-green-400'
  if (ratio >= 1.05 && ratio <= 1.30) return 'text-yellow-400'
  return 'text-signal-hi'
}

function ratingLabel(ratio: number): string {
  if (ratio >= 1.10 && ratio <= 1.20) return 'Flat ride'
  if (ratio >= 1.05 && ratio <= 1.30) return 'Acceptable'
  return 'Outside guideline'
}

function toNPerM(value: number, isImperial: boolean): number {
  return isImperial ? lbPerInToNPerM(value) : nPerMmToNPerM(value)
}

function FrequencyDisplay({ label, hz }: { label: string; hz: number }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-display text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-txt">
        {label}
      </span>
      <span className="font-data text-2xl font-semibold text-data leading-none tabular-nums">
        {hz > 0 ? `${hz.toFixed(2)} Hz` : '—'}
      </span>
      <div className="h-px w-8 bg-signal/40 rounded-full" />
    </div>
  )
}

export default function SuspensionFrequencyCard({ totalWeightKg }: SuspensionFrequencyCardProps) {
  const units = useUnitStore(state => state.units)
  const isImperial = units === 'imperial'
  const springRateUnit = isImperial ? 'lb/in' : 'N/mm'

  // Spring rates in display units
  const [frontSpringRate, setFrontSpringRate] = useState('')
  const [rearSpringRate, setRearSpringRate] = useState('')

  // Motion ratios (dimensionless)
  const [frontMotionRatio, setFrontMotionRatio] = useState('1.0')
  const [rearMotionRatio, setRearMotionRatio] = useState('1.0')

  // Weight distribution
  const [frontDistPct, setFrontDistPct] = useState('55')

  // Per-corner mode
  const [perCornerMode, setPerCornerMode] = useState(false)
  const [lfWeight, setLfWeight] = useState('')
  const [rfWeight, setRfWeight] = useState('')
  const [lrWeight, setLrWeight] = useState('')
  const [rrWeight, setRrWeight] = useState('')

  // Parse numeric values
  const fSpring = parseFloat(frontSpringRate) || 0
  const rSpring = parseFloat(rearSpringRate) || 0
  const fMR = parseFloat(frontMotionRatio) || 0
  const rMR = parseFloat(rearMotionRatio) || 0
  const fDistPct = parseFloat(frontDistPct) || 0

  const cornerWeights = useMemo<CornerWeights>(() => {
    if (perCornerMode) {
      return {
        lf: parseFloat(lfWeight) || 0,
        rf: parseFloat(rfWeight) || 0,
        lr: parseFloat(lrWeight) || 0,
        rr: parseFloat(rrWeight) || 0,
      }
    }
    const frontTotal = totalWeightKg * (fDistPct / 100)
    const rearTotal = totalWeightKg - frontTotal
    return {
      lf: frontTotal / 2,
      rf: frontTotal / 2,
      lr: rearTotal / 2,
      rr: rearTotal / 2,
    }
  }, [perCornerMode, lfWeight, rfWeight, lrWeight, rrWeight, totalWeightKg, fDistPct])

  const frequencies = useMemo(() => {
    const fWheelRate = wheelRateNPerM(toNPerM(fSpring, isImperial), fMR)
    const rWheelRate = wheelRateNPerM(toNPerM(rSpring, isImperial), rMR)

    const lfHz = suspensionFrequencyHz(fWheelRate, cornerWeights.lf)
    const rfHz = suspensionFrequencyHz(fWheelRate, cornerWeights.rf)
    const lrHz = suspensionFrequencyHz(rWheelRate, cornerWeights.lr)
    const rrHz = suspensionFrequencyHz(rWheelRate, cornerWeights.rr)

    // Average front/rear for ratio calculation
    const frontAvgHz = (lfHz + rfHz) / 2
    const rearAvgHz = (lrHz + rrHz) / 2
    const ratio = frequencyRatio(frontAvgHz, rearAvgHz)

    return { lfHz, rfHz, lrHz, rrHz, frontAvgHz, rearAvgHz, ratio }
  }, [fSpring, rSpring, fMR, rMR, cornerWeights, isImperial])

  const hasValidInputs = fSpring > 0 && rSpring > 0 && fMR > 0 && rMR > 0

  // Pre-populate per-corner weights from distribution when toggling on
  const handlePerCornerToggle = () => {
    if (!perCornerMode) {
      const frontTotal = totalWeightKg * (fDistPct / 100)
      const rearTotal = totalWeightKg - frontTotal
      setLfWeight((frontTotal / 2).toFixed(1))
      setRfWeight((frontTotal / 2).toFixed(1))
      setLrWeight((rearTotal / 2).toFixed(1))
      setRrWeight((rearTotal / 2).toFixed(1))
    }
    setPerCornerMode(prev => !prev)
  }

  return (
    <div className="rounded-xl border border-line bg-panel p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-4 rounded-full bg-signal" />
        <span className="font-display text-[11px] font-semibold tracking-[0.2em] uppercase text-label">
          Suspension Frequency
        </span>
      </div>

      {/* Inputs grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4">
        {/* Front spring rate */}
        <div className="flex flex-col gap-1">
          <label className="font-display text-[10px] font-semibold tracking-widest uppercase text-muted-txt">
            Front Spring Rate ({springRateUnit})
          </label>
          <input
            type="number"
            value={frontSpringRate}
            onChange={e => setFrontSpringRate(e.target.value)}
            placeholder="e.g. 500"
            min={0}
            step={10}
            className={INPUT_CLS}
            aria-label={`Front spring rate in ${springRateUnit}`}
          />
        </div>

        {/* Rear spring rate */}
        <div className="flex flex-col gap-1">
          <label className="font-display text-[10px] font-semibold tracking-widest uppercase text-muted-txt">
            Rear Spring Rate ({springRateUnit})
          </label>
          <input
            type="number"
            value={rearSpringRate}
            onChange={e => setRearSpringRate(e.target.value)}
            placeholder="e.g. 600"
            min={0}
            step={10}
            className={INPUT_CLS}
            aria-label={`Rear spring rate in ${springRateUnit}`}
          />
        </div>

        {/* Front motion ratio */}
        <div className="flex flex-col gap-1">
          <label className="font-display text-[10px] font-semibold tracking-widest uppercase text-muted-txt">
            Front Motion Ratio
          </label>
          <input
            type="number"
            value={frontMotionRatio}
            onChange={e => setFrontMotionRatio(e.target.value)}
            min={0}
            step={0.05}
            className={INPUT_CLS}
            aria-label="Front motion ratio"
          />
        </div>

        {/* Rear motion ratio */}
        <div className="flex flex-col gap-1">
          <label className="font-display text-[10px] font-semibold tracking-widest uppercase text-muted-txt">
            Rear Motion Ratio
          </label>
          <input
            type="number"
            value={rearMotionRatio}
            onChange={e => setRearMotionRatio(e.target.value)}
            min={0}
            step={0.05}
            className={INPUT_CLS}
            aria-label="Rear motion ratio"
          />
        </div>
      </div>

      {/* Weight distribution section */}
      <div className="border-t border-faint pt-3 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-display text-[10px] font-semibold tracking-widest uppercase text-muted-txt">
            Weight Distribution
          </span>
          <button
            type="button"
            onClick={handlePerCornerToggle}
            className="font-data text-[10px] text-muted-txt hover:text-gray-300 underline underline-offset-2 transition-colors"
          >
            {perCornerMode ? 'Use F/R split' : 'Per-corner weights'}
          </button>
        </div>

        {!perCornerMode ? (
          <div className="flex items-end gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <label className="font-display text-[10px] font-semibold tracking-widest uppercase text-muted-txt">
                Front %
              </label>
              <input
                type="number"
                value={frontDistPct}
                onChange={e => setFrontDistPct(e.target.value)}
                min={0}
                max={100}
                step={0.5}
                className={INPUT_CLS}
                aria-label="Front weight distribution percentage"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="font-display text-[10px] font-semibold tracking-widest uppercase text-muted-txt">
                Rear %
              </label>
              <span className="px-2 py-1.5 text-sm font-data text-muted-txt tabular-nums">
                {(100 - fDistPct).toFixed(1)}%
              </span>
            </div>
            <div className="flex-1">
              <p className="font-data text-[11px] text-muted-txt">
                Total: {totalWeightKg.toFixed(0)} kg
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div className="flex flex-col gap-1">
              <label className="font-display text-[10px] font-semibold tracking-widest uppercase text-muted-txt">
                LF (kg)
              </label>
              <input
                type="number"
                value={lfWeight}
                onChange={e => setLfWeight(e.target.value)}
                min={0}
                step={1}
                className={INPUT_CLS}
                aria-label="Left front corner weight in kg"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-display text-[10px] font-semibold tracking-widest uppercase text-muted-txt">
                RF (kg)
              </label>
              <input
                type="number"
                value={rfWeight}
                onChange={e => setRfWeight(e.target.value)}
                min={0}
                step={1}
                className={INPUT_CLS}
                aria-label="Right front corner weight in kg"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-display text-[10px] font-semibold tracking-widest uppercase text-muted-txt">
                LR (kg)
              </label>
              <input
                type="number"
                value={lrWeight}
                onChange={e => setLrWeight(e.target.value)}
                min={0}
                step={1}
                className={INPUT_CLS}
                aria-label="Left rear corner weight in kg"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-display text-[10px] font-semibold tracking-widest uppercase text-muted-txt">
                RR (kg)
              </label>
              <input
                type="number"
                value={rrWeight}
                onChange={e => setRrWeight(e.target.value)}
                min={0}
                step={1}
                className={INPUT_CLS}
                aria-label="Right rear corner weight in kg"
              />
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {hasValidInputs && (
        <div className="border-t border-faint pt-4">
          {/* Front / Rear frequencies */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
            <FrequencyDisplay label="Front" hz={frequencies.frontAvgHz} />
            <FrequencyDisplay label="Rear" hz={frequencies.rearAvgHz} />

            {/* F/R Ratio */}
            {frequencies.ratio > 0 && (
              <div className="flex flex-col gap-1">
                <span className="font-display text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-txt">
                  R/F Ratio
                </span>
                <span className={`font-data text-2xl font-semibold leading-none tabular-nums ${ratingColor(frequencies.ratio)}`}>
                  {frequencies.ratio.toFixed(3)}
                </span>
                <span className={`font-data text-[10px] ${ratingColor(frequencies.ratio)}`}>
                  {ratingLabel(frequencies.ratio)}
                </span>
              </div>
            )}
          </div>

          {/* Per-corner breakdown */}
          {perCornerMode && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-faint">
              <FrequencyDisplay label="Left Front" hz={frequencies.lfHz} />
              <FrequencyDisplay label="Right Front" hz={frequencies.rfHz} />
              <FrequencyDisplay label="Left Rear" hz={frequencies.lrHz} />
              <FrequencyDisplay label="Right Rear" hz={frequencies.rrHz} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
