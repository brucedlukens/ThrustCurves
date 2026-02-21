import { useEffect, useState, useMemo } from 'react'
import { usePersistenceStore } from '@/store/persistenceStore'
import { useCarStore } from '@/store/carStore'
import { useUnitStore } from '@/store/unitStore'
import { mphToMs } from '@/utils/units'
import { useComparison } from '@/hooks/useComparison'
import { runSimulation } from '@/engine'
import { DEFAULT_MODIFICATIONS } from '@/types/config'
import type { ComparisonEntry } from '@/hooks/useComparison'
import type { TimeStep } from '@/types/simulation'
import SavedConfigsList from '@/components/saved/SavedConfigsList'
import ComparisonChart from '@/components/charts/ComparisonChart'
import ComparisonAccelerationChart from '@/components/charts/ComparisonAccelerationChart'
import ComparisonDynoChart from '@/components/charts/ComparisonDynoChart'
import ComparisonTable from '@/components/results/ComparisonTable'

/** Find elapsed time between two speed thresholds in a trace */
function computeRangeTime(trace: TimeStep[], fromMs: number, toMs: number): number | null {
  if (fromMs >= toMs || trace.length === 0) return null
  let startTime: number | null = null
  let endTime: number | null = null
  for (const step of trace) {
    if (startTime === null && step.speedMs >= fromMs) startTime = step.timeS
    if (startTime !== null && step.speedMs >= toMs) { endTime = step.timeS; break }
  }
  if (startTime === null || endTime === null) return null
  return endTime - startTime
}

interface SectionLabelProps {
  children: React.ReactNode
  hint?: string
}

function SectionLabel({ children, hint }: SectionLabelProps) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2">
        <div className="w-1 h-3.5 rounded-full bg-signal/60" />
        <span className="font-display text-[11px] font-semibold tracking-[0.2em] uppercase text-label">
          {children}
        </span>
      </div>
      {hint && (
        <p className="font-data text-[11px] text-muted-txt mt-1 ml-3 leading-snug">{hint}</p>
      )}
    </div>
  )
}

interface CompareRangePanelProps {
  entries: ComparisonEntry[]
}

function CompareRangePanel({ entries }: CompareRangePanelProps) {
  const units = useUnitStore(state => state.units)
  const speedUnit = units === 'imperial' ? 'mph' : 'km/h'
  const [fromSpeed, setFromSpeed] = useState(0)
  const [toSpeed, setToSpeed] = useState(units === 'imperial' ? 60 : 100)

  const results = useMemo(() => {
    return entries.map(entry => {
      const fromMs = units === 'imperial' ? mphToMs(fromSpeed) : fromSpeed / 3.6
      const toMs = units === 'imperial' ? mphToMs(toSpeed) : toSpeed / 3.6
      const t = computeRangeTime(entry.result.trace, fromMs, toMs)
      return { name: entry.setup.name, timeS: t }
    })
  }, [entries, fromSpeed, toSpeed, units])

  if (entries.length === 0) return null

  return (
    <div className="rounded-xl border border-line bg-panel p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-4 rounded-full bg-signal/60" />
        <span className="font-display text-[11px] font-semibold tracking-[0.2em] uppercase text-label">
          Custom Range
        </span>
      </div>
      <div className="flex flex-wrap items-end gap-4 mb-4">
        <div className="flex flex-col gap-1.5">
          <label className="font-display text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-txt">
            From ({speedUnit})
          </label>
          <input
            type="number"
            min={0}
            value={fromSpeed}
            onChange={e => setFromSpeed(Math.max(0, Number(e.target.value)))}
            className="w-24 px-3 py-2 rounded-lg border border-line bg-lift font-data text-sm text-data text-right tabular-nums focus:outline-none focus:border-signal/60 transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-display text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-txt">
            To ({speedUnit})
          </label>
          <input
            type="number"
            value={toSpeed}
            onChange={e => setToSpeed(Math.max(fromSpeed + 1, Number(e.target.value)))}
            className="w-24 px-3 py-2 rounded-lg border border-line bg-lift font-data text-sm text-data text-right tabular-nums focus:outline-none focus:border-signal/60 transition-colors"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {results.map(({ name, timeS }) => (
          <div key={name} className="flex items-baseline justify-between gap-3 py-1 border-b border-faint last:border-0">
            <span className="font-data text-xs text-gray-400 truncate">{name}</span>
            <span className="font-data text-base font-semibold tabular-nums text-data shrink-0">
              {timeS !== null ? `${timeS.toFixed(2)}s` : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ComparePage() {
  const { savedSetups, isLoading, loadSetups } = usePersistenceStore()
  const cars = useCarStore(state => state.cars)
  const { selectedIds, toggleSetup, clearSelection, entries } = useComparison()

  const [oemSelectedIds, setOemSelectedIds] = useState<string[]>([])

  useEffect(() => {
    loadSetups()
  }, [loadSetups])

  const toggleOem = (carId: string) => {
    setOemSelectedIds(prev =>
      prev.includes(carId) ? prev.filter(id => id !== carId) : [...prev, carId]
    )
  }

  const oemEntries = useMemo<ComparisonEntry[]>(() => {
    return oemSelectedIds.flatMap(carId => {
      const car = cars.find(c => c.id === carId)
      if (!car) return []
      try {
        return [{
          setup: {
            id: `oem-${car.id}`,
            name: `${car.year} ${car.make} ${car.model} (Stock)`,
            carId: car.id,
            modifications: DEFAULT_MODIFICATIONS,
            createdAt: '',
            updatedAt: '',
          },
          result: runSimulation(car, DEFAULT_MODIFICATIONS),
        }]
      } catch {
        return []
      }
    })
  }, [oemSelectedIds, cars])

  const allEntries = [...entries, ...oemEntries]
  const hasSelection = selectedIds.length > 0 || oemSelectedIds.length > 0

  const clearAll = () => {
    clearSelection()
    setOemSelectedIds([])
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 min-h-0 h-full">

      {/* ── Left: Setup selector ────────────────────────── */}
      <div className="lg:w-72 shrink-0 flex flex-col gap-4 lg:overflow-y-auto">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-gray-100 uppercase mb-0.5">
            Compare
          </h1>
          <p className="font-data text-xs text-muted-txt">
            Select setups and stock cars to overlay thrust envelopes
          </p>
        </div>

        {/* Saved Setups */}
        <div className="border-t border-faint pt-4">
          <SectionLabel>Saved Setups</SectionLabel>

          {isLoading && (
            <div className="flex items-center gap-2 py-3">
              <div className="w-1.5 h-1.5 rounded-full bg-signal animate-pulse" />
              <span className="font-data text-xs text-muted-txt">Loading…</span>
            </div>
          )}

          {!isLoading && (
            <SavedConfigsList
              setups={savedSetups}
              cars={cars}
              selectedIds={selectedIds}
              onToggleCompare={toggleSetup}
            />
          )}

          {!isLoading && savedSetups.length === 0 && (
            <p className="font-data text-xs text-muted-txt py-2">No saved setups yet.</p>
          )}
        </div>

        {/* OEM Stock Cars */}
        <div className="border-t border-faint pt-4">
          <SectionLabel>OEM Stock</SectionLabel>
          <div className="flex flex-col gap-1">
            {cars.map(car => {
              const isSelected = oemSelectedIds.includes(car.id)
              return (
                <button
                  key={car.id}
                  type="button"
                  onClick={() => toggleOem(car.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                    isSelected
                      ? 'border-signal/60 bg-signal-dim text-signal-hi'
                      : 'border-line bg-lift hover:bg-raised text-gray-300'
                  }`}
                >
                  <span className="font-data text-xs">
                    {car.year} {car.make} {car.model}
                  </span>
                  {car.trim && (
                    <span className="font-data text-[10px] text-muted-txt ml-1.5">{car.trim}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {hasSelection && (
          <button
            onClick={clearAll}
            className="font-data text-xs text-muted-txt hover:text-gray-300 underline underline-offset-2 self-start transition-colors"
          >
            Clear selection
          </button>
        )}
      </div>

      {/* ── Right: Charts + Table ───────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col gap-5 lg:overflow-y-auto">

        {allEntries.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-signal animate-pulse" />
            <span className="font-display text-xs font-medium tracking-widest uppercase text-label">
              Comparing {allEntries.length} setup{allEntries.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Comparison chart */}
        <div>
          <SectionLabel hint="Overlay of maximum available thrust across speed for all selected setups. The first selected is the base for delta calculations.">
            Thrust Envelope Comparison
          </SectionLabel>
          <div className="chart-frame p-4 h-[280px] lg:h-[340px]">
            <ComparisonChart entries={allEntries} />
          </div>
        </div>

        {/* Acceleration G comparison */}
        <div>
          <SectionLabel hint="G-force across speed for each setup. Higher values indicate stronger acceleration at that speed.">
            Acceleration (G)
          </SectionLabel>
          <div className="chart-frame p-4 h-[280px] lg:h-[340px]">
            <ComparisonAccelerationChart entries={allEntries} />
          </div>
        </div>

        {/* Dyno comparison */}
        <div>
          <SectionLabel hint="Engine torque curve by RPM for each selected car. Reflects the OEM engine spec — modifications do not alter the engine curve.">
            Engine Torque (Dyno)
          </SectionLabel>
          <div className="chart-frame p-4 h-[280px] lg:h-[340px]">
            <ComparisonDynoChart entries={allEntries} />
          </div>
        </div>

        {/* Custom range */}
        {allEntries.length > 0 && (
          <CompareRangePanel entries={allEntries} />
        )}

        {allEntries.length > 0 && (
          <div>
            <SectionLabel hint="Side-by-side comparison of key performance numbers. Delta shows the difference relative to the first (base) setup.">
              Performance Metrics
            </SectionLabel>
            <ComparisonTable entries={allEntries} />
          </div>
        )}
      </div>
    </div>
  )
}
