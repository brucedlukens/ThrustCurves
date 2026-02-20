import { useEffect } from 'react'
import { usePersistenceStore } from '@/store/persistenceStore'
import { useCarStore } from '@/store/carStore'
import { useComparison } from '@/hooks/useComparison'
import SavedConfigsList from '@/components/saved/SavedConfigsList'
import ComparisonChart from '@/components/charts/ComparisonChart'
import ComparisonTable from '@/components/results/ComparisonTable'

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-1 h-3.5 rounded-full bg-signal/60" />
      <span className="font-display text-[11px] font-semibold tracking-[0.2em] uppercase text-label">
        {children}
      </span>
    </div>
  )
}

export default function ComparePage() {
  const { savedSetups, isLoading, loadSetups } = usePersistenceStore()
  const cars = useCarStore(state => state.cars)
  const { selectedIds, toggleSetup, clearSelection, entries } = useComparison()

  useEffect(() => {
    loadSetups()
  }, [loadSetups])

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 min-h-0 h-full">

      {/* ── Left: Setup selector ────────────────────────── */}
      <div className="lg:w-72 shrink-0 flex flex-col gap-4 lg:overflow-y-auto">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-gray-100 uppercase mb-0.5">
            Compare
          </h1>
          <p className="font-data text-xs text-muted-txt">
            Select saved setups to overlay thrust envelopes
          </p>
        </div>

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
        </div>

        {selectedIds.length > 0 && (
          <button
            onClick={clearSelection}
            className="font-data text-xs text-muted-txt hover:text-gray-300 underline underline-offset-2 self-start transition-colors"
          >
            Clear selection
          </button>
        )}
      </div>

      {/* ── Right: Charts + Table ───────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col gap-5 lg:overflow-y-auto">

        {entries.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-signal animate-pulse" />
            <span className="font-display text-xs font-medium tracking-widest uppercase text-label">
              Comparing {entries.length} setup{entries.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Comparison chart */}
        <div>
          <SectionLabel>Thrust Envelope Comparison</SectionLabel>
          <div className="chart-frame p-4 h-[280px] lg:h-[340px]">
            <ComparisonChart entries={entries} />
          </div>
        </div>

        {entries.length > 0 && (
          <div>
            <SectionLabel>Performance Metrics</SectionLabel>
            <ComparisonTable entries={entries} />
          </div>
        )}
      </div>
    </div>
  )
}
