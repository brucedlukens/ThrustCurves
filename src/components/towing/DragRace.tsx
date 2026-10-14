import { useMemo, useState } from 'react'
import { towingRun } from '@/engine/towing'
import { playbackDurationS, sampleTrace } from '@/engine/playback'
import { usePlayback } from '@/hooks/usePlayback'
import { useUnitStore } from '@/store/unitStore'
import { mphToMs } from '@/utils/units'
import type { TrailerCategory } from '@/types/truck'
import type { TowingEntry } from './entry'
import DragLanes from './DragLanes'
import type { LaneState } from './DragLanes'
import RaceSpeedChart from './RaceSpeedChart'
import type { RaceSeries } from './RaceSpeedChart'
import { fmtSpeedMs, gearLabel } from './format'

interface RunPreset {
  id: string
  label: string
  fromMph: number
  toMph: number
}

const RUN_PRESETS: RunPreset[] = [
  { id: '0-60', label: '0–60 mph', fromMph: 0, toMph: 60 },
  { id: '40-60', label: '40–60 mph', fromMph: 40, toMph: 60 },
  { id: '50-70', label: '50–70 mph', fromMph: 50, toMph: 70 },
]

const RATES = [0.5, 1, 2, 4]

/** Redline speed of each gear (m/s), index 0 = 1st */
function gearRedlineSpeeds(entry: TowingEntry): number[] {
  return entry.analysis.gearCurves.map((gc) => gc.speedRangeMs[1])
}

interface DragRaceProps {
  entries: TowingEntry[]
  trailerCategory: TrailerCategory
}

interface ToggleProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  label?: string
}

function Toggle({ active, onClick, children, label }: ToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      onClick={onClick}
      className={`px-2.5 py-1 rounded font-data text-[11px] transition-colors ${
        active
          ? 'bg-signal-dim text-signal-hi border border-signal/60'
          : 'bg-lift text-muted-txt border border-line hover:text-gray-300'
      }`}
    >
      {children}
    </button>
  )
}

const CONTROL_BTN =
  'px-3 py-1 rounded border border-line bg-lift font-display text-xs font-semibold tracking-widest uppercase text-gray-200 hover:border-signal/60 transition-colors'

/**
 * Animated acceleration comparison: every truck launches together with the
 * trailer on the scenario grade, shown as side-by-side lanes plus a synced
 * speed-vs-time chart.
 */
export default function DragRace({ entries, trailerCategory }: DragRaceProps) {
  const units = useUnitStore((s) => s.units)
  const [preset, setPreset] = useState<RunPreset>(RUN_PRESETS[0])
  const fromMs = mphToMs(preset.fromMph)
  const toMs = mphToMs(preset.toMph)

  // Chosen hold gear per truck; a choice that's over redline at this run's start speed is ignored
  const [holdChoices, setHoldChoices] = useState<Record<string, number>>({})
  const heldGears = useMemo(
    () =>
      entries.map((e) => {
        const gear = holdChoices[e.key]
        if (gear === undefined) return undefined
        const redline = gearRedlineSpeeds(e)[gear - 1]
        return redline !== undefined && redline >= fromMs ? gear : undefined
      }),
    [entries, holdChoices, fromMs],
  )

  const runs = useMemo(
    () =>
      entries.map((e, i) => ({
        entry: e,
        heldGear: heldGears[i],
        ...towingRun(e.analysis.integration, fromMs, toMs, heldGears[i]),
      })),
    [entries, fromMs, toMs, heldGears],
  )
  const durationS = useMemo(() => playbackDurationS(runs), [runs])
  const series = useMemo<RaceSeries[]>(
    () => runs.map((r) => ({ key: r.entry.key, name: r.entry.name, color: r.entry.color, trace: r.trace })),
    [runs],
  )

  const playback = usePlayback(durationS, runs)
  const { timeS } = playback

  const lanes: LaneState[] = runs.map((r) => ({
    key: r.entry.key,
    name: r.entry.name,
    color: r.entry.color,
    sample: sampleTrace(r.trace, timeS),
    finishTimeS: r.finishTimeS,
    finishDistanceM: r.finishTimeS !== null ? (r.trace.at(-1)?.distanceM ?? null) : null,
    heldGear: r.heldGear,
    heldRedlineMs: r.heldGear !== undefined ? gearRedlineSpeeds(r.entry)[r.heldGear - 1] : undefined,
  }))

  const nonFinishers = runs.filter((r) => r.finishTimeS === null)

  return (
    <div className="flex flex-col gap-3">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex gap-1.5" role="group" aria-label="Run">
          {RUN_PRESETS.map((p) => (
            <Toggle key={p.id} active={p.id === preset.id} onClick={() => setPreset(p)}>
              {p.label}
            </Toggle>
          ))}
        </div>
        <div className="flex gap-1.5">
          {playback.playing ? (
            <button type="button" className={CONTROL_BTN} onClick={playback.pause}>
              Pause
            </button>
          ) : (
            <button type="button" className={CONTROL_BTN} onClick={playback.play}>
              Play
            </button>
          )}
          <button type="button" className={CONTROL_BTN} onClick={playback.restart}>
            Restart
          </button>
        </div>
        <div className="flex gap-1.5" role="group" aria-label="Playback speed">
          {RATES.map((r) => (
            <Toggle key={r} active={playback.rate === r} onClick={() => playback.setRate(r)} label={`${r}× speed`}>
              {r}×
            </Toggle>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-display text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-txt">
          Hold gear
        </span>
        {entries.map((e, i) => {
          const redlines = gearRedlineSpeeds(e)
          const held = heldGears[i]
          return (
            <label key={e.key} className="flex items-center gap-1.5" title={e.name}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} />
              <span className="font-display text-[11px] tracking-wide text-label">{e.truck.model}</span>
              <select
                aria-label={`${e.name} hold gear`}
                value={held ?? 'auto'}
                onChange={(ev) => {
                  const v = ev.target.value
                  setHoldChoices((prev) => {
                    const next = { ...prev }
                    if (v === 'auto') delete next[e.key]
                    else next[e.key] = Number(v)
                    return next
                  })
                }}
                className="px-2 py-0.5 rounded border border-line bg-lift font-data text-[11px] text-data focus:outline-none focus:border-signal/60"
              >
                <option value="auto">Auto</option>
                {redlines.map((redlineMs, i) => (
                  <option key={i + 1} value={i + 1} disabled={redlineMs < fromMs}>
                    {gearLabel(i + 1)}
                    {redlineMs < fromMs ? ' (over redline)' : ''}
                  </option>
                ))}
              </select>
            </label>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <input
          type="range"
          aria-label="Playback position"
          min={0}
          max={durationS}
          step={0.01}
          value={timeS}
          onChange={(e) => playback.seek(Number(e.target.value))}
          className="flex-1 accent-signal"
        />
        <span className="font-data text-xs tabular-nums text-data w-24 text-right">
          {timeS.toFixed(1)} / {durationS.toFixed(1)} s
        </span>
      </div>

      <div className="chart-frame p-3">
        <DragLanes lanes={lanes} timeS={timeS} trailerCategory={trailerCategory} />
      </div>

      {nonFinishers.length > 0 && (
        <p className="font-data text-[11px] text-muted-txt">
          {nonFinishers.map((r, i) => (
            <span key={r.entry.key}>
              {i > 0 && ' · '}
              <span style={{ color: r.entry.color }}>{r.entry.name}</span> can't reach{' '}
              {preset.toMph} mph on this grade (settles at {fmtSpeedMs(r.trace.at(-1)?.speedMs ?? 0, units)})
            </span>
          ))}
        </p>
      )}

      <div className="chart-frame p-4 h-[240px] lg:h-[280px]">
        <RaceSpeedChart
          series={series}
          durationS={durationS}
          targetMs={toMs}
          timeS={timeS}
          onSeek={playback.seek}
        />
      </div>
    </div>
  )
}
