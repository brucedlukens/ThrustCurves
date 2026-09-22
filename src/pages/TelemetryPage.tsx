import { useMemo, useState } from 'react'
import { useCarStore } from '@/store/carStore'
import { useTelemetryStore } from '@/store/telemetryStore'
import { DEFAULT_MODIFICATIONS } from '@/types/config'
import { GRAVITY_MS2 } from '@/data/presets'
import { analyzeWhatIf, buildPowertrainModel, computeGripEnvelope, inferRoadDyno } from '@/engine/telemetry'
import CarSearch from '@/components/car-selector/CarSearch'
import ModificationsPanel from '@/components/editor/ModificationsPanel'
import LogUploader from '@/components/telemetry/LogUploader'
import ChannelMapper from '@/components/telemetry/ChannelMapper'
import AnalysisOptions from '@/components/telemetry/AnalysisOptions'
import SpeedTraceChart from '@/components/telemetry/SpeedTraceChart'
import RoadDynoChart from '@/components/telemetry/RoadDynoChart'
import SegmentTable from '@/components/telemetry/SegmentTable'
import WhatIfSummary from '@/components/telemetry/WhatIfSummary'
import { CARD_CLS } from '@/components/telemetry/shared'

interface CollapsibleSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function CollapsibleSection({ title, children, defaultOpen = true }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  return (
    <div>
      <button type="button" onClick={() => setIsOpen(o => !o)} className="flex w-full items-center justify-between py-2">
        <span className="font-display text-[11px] font-semibold tracking-[0.2em] uppercase text-label">{title}</span>
        <svg
          className={`w-3.5 h-3.5 text-label transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && children}
    </div>
  )
}

function CardHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-3">
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 rounded-full bg-signal/60" />
        <span className="font-display text-[11px] font-semibold tracking-[0.2em] uppercase text-label">{title}</span>
      </div>
      {hint && <span className="font-data text-[10px] text-muted-txt">{hint}</span>}
    </div>
  )
}

export default function TelemetryPage() {
  const run = useTelemetryStore(state => state.run)
  const options = useTelemetryStore(state => state.options)
  const envelopeOverrides = useTelemetryStore(state => state.envelopeOverrides)
  const selectedCar = useCarStore(state => state.cars.find(c => c.id === state.selectedCarId))
  const modifications = useCarStore(state => state.modifications)
  const updateModifications = useCarStore(state => state.updateModifications)

  // Offer the log's GPS elevation as the altitude setting when it differs materially
  const logElevationM = run?.elevationM
  const altitudeHint =
    logElevationM !== undefined && selectedCar && Math.abs(logElevationM - modifications.altitudeM) > 150
      ? Math.round(logElevationM)
      : null

  const measuredEnvelope = useMemo(
    () => (run ? computeGripEnvelope(run.samples, run.hasLatAccel) : null),
    [run],
  )

  const analysis = useMemo(() => {
    if (!run || !selectedCar) return null
    try {
      const result = analyzeWhatIf(run, selectedCar, modifications, { ...options, envelopeOverrides })
      const baseline = buildPowertrainModel(selectedCar, { ...DEFAULT_MODIFICATIONS, altitudeM: modifications.altitudeM })
      const modified = buildPowertrainModel(selectedCar, modifications)
      const roadDyno = inferRoadDyno(run.samples, result.kinds, { ...baseline, gravityMs2: GRAVITY_MS2 })
      return { result, baseline, modified, roadDyno, error: null }
    } catch (err) {
      return { result: null, baseline: null, modified: null, roadDyno: [], error: err instanceof Error ? err.message : 'Analysis failed' }
    }
  }, [run, selectedCar, modifications, options, envelopeOverrides])

  const hasChange = !!analysis?.result && analysis.result.modifiedSpeedsMs.some((v, i) => Math.abs(v - analysis.result!.baselineSpeedsMs[i]) > 1e-6)
  const maxSpeedMs = run ? Math.max(...run.samples.map(s => s.speedMs)) : 0

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 min-h-0 h-full">
      {/* ── Left column: inputs ─────────────────────────────── */}
      <div className="lg:w-80 shrink-0 flex flex-col gap-4 lg:overflow-y-auto">
        <LogUploader />

        {run && (
          <CollapsibleSection title="Channel Mapping" defaultOpen={false}>
            <ChannelMapper />
          </CollapsibleSection>
        )}

        <CollapsibleSection title="Select Car" defaultOpen={!selectedCar}>
          <CarSearch />
        </CollapsibleSection>

        {selectedCar && (
          <CollapsibleSection title="What-If Modifications">
            <ModificationsPanel car={selectedCar} />
          </CollapsibleSection>
        )}

        {run && (
          <CollapsibleSection title="Analysis Options">
            <AnalysisOptions measured={measuredEnvelope} hasRpm={run.hasRpm} hasLatAccel={run.hasLatAccel} />
          </CollapsibleSection>
        )}
      </div>

      {/* ── Right column: results ───────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col gap-4 lg:overflow-y-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-px bg-signal" />
          <h1 className="font-display text-xs font-semibold tracking-[0.3em] uppercase text-signal">Telemetry What-If</h1>
        </div>

        {!run && (
          <div className={`${CARD_CLS} flex flex-col gap-2`}>
            <p className="font-data text-sm text-label leading-relaxed">
              Load a logged run, pick the car it was driven in, then change power, gearing, weight or aero.
              The tool finds where the engine was the limit, re-runs only those stretches, and reports the time
              difference per stretch and for the whole run.
            </p>
            <p className="font-data text-xs text-muted-txt leading-relaxed">
              Best with throttle and rpm channels; works with time + speed alone.
            </p>
          </div>
        )}

        {run && !selectedCar && (
          <div className={CARD_CLS}>
            <p className="font-data text-sm text-label">Select the car this run was logged in to analyze it.</p>
          </div>
        )}

        {altitudeHint !== null && (
          <div className={`${CARD_CLS} flex flex-wrap items-center justify-between gap-3 py-3`}>
            <p className="font-data text-xs text-label">
              The log was recorded at about {altitudeHint} m elevation; the altitude setting is {modifications.altitudeM} m.
              Both baseline and modified thrust are derated for altitude, so the calibration factor absorbs the gap, but
              the road dyno comparison is cleaner with the right value.
            </p>
            <button
              type="button"
              onClick={() => updateModifications({ altitudeM: altitudeHint })}
              className="px-3 py-1.5 rounded border border-line bg-lift hover:bg-raised text-xs font-display tracking-wide uppercase text-gray-200 transition-colors"
            >
              Use {altitudeHint} m
            </button>
          </div>
        )}

        {analysis?.error && (
          <p role="alert" className="font-data text-xs text-signal-hi">
            {analysis.error}
          </p>
        )}

        {run && analysis?.result && analysis.baseline && analysis.modified && (
          <>
            <WhatIfSummary result={analysis.result} hasChange={hasChange} />

            <div className={`${CARD_CLS} h-[420px] shrink-0 flex flex-col`}>
              <CardHeader title="Speed vs Distance" hint="bands show what limited the car" />
              <div className="flex-1 min-h-0">
                <SpeedTraceChart run={run} result={analysis.result} />
              </div>
            </div>

            <div className={CARD_CLS}>
              <CardHeader title="Power-Limited Stretches" hint="windows run to the next power-limited stretch" />
              <SegmentTable results={analysis.result.segmentResults} hasChange={hasChange} />
            </div>

            <div className={`${CARD_CLS} h-[340px] shrink-0 flex flex-col`}>
              <CardHeader title="Road Dyno" hint="wheel force implied by the log vs the model" />
              <div className="flex-1 min-h-0">
                <RoadDynoChart
                  points={analysis.roadDyno}
                  baselineEnvelope={analysis.baseline.envelope}
                  modifiedEnvelope={analysis.modified.envelope}
                  calibrationFactor={analysis.result.calibrationFactor}
                  maxSpeedMs={maxSpeedMs}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
