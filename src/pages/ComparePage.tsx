import { useEffect } from 'react'
import { usePersistenceStore } from '@/store/persistenceStore'
import { useCarStore } from '@/store/carStore'
import { useComparison } from '@/hooks/useComparison'
import SavedConfigsList from '@/components/saved/SavedConfigsList'
import ComparisonChart from '@/components/charts/ComparisonChart'
import ComparisonTable from '@/components/results/ComparisonTable'

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-0.5 h-4 shrink-0" style={{ backgroundColor: 'var(--color-accent)' }} />
      <h3
        className="text-[10px] uppercase tracking-widest"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-3)' }}
      >
        {children}
      </h3>
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
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 min-h-0 h-full">
      {/* Left: Setup selector */}
      <div className="md:w-72 md:shrink-0 flex flex-col gap-4 md:overflow-y-auto">
        <div>
          <h2
            className="text-xl md:text-2xl font-bold uppercase tracking-widest mb-1"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-1)' }}
          >
            Compare
          </h2>
          <p
            className="text-xs"
            style={{ fontFamily: 'var(--font-ui)', color: 'var(--color-text-3)' }}
          >
            Toggle setups to overlay thrust envelopes
          </p>
        </div>

        {isLoading && (
          <p className="text-sm" style={{ color: 'var(--color-text-3)' }}>Loading…</p>
        )}

        {!isLoading && (
          <SavedConfigsList
            setups={savedSetups}
            cars={cars}
            selectedIds={selectedIds}
            onToggleCompare={toggleSetup}
          />
        )}

        {selectedIds.length > 0 && (
          <button
            onClick={clearSelection}
            className="text-xs underline self-start"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-3)' }}
          >
            Clear selection
          </button>
        )}
      </div>

      {/* Right: Charts + Table */}
      <div className="flex-1 min-w-0 flex flex-col gap-5 md:gap-6 overflow-y-auto">
        {entries.length > 0 && (
          <p
            className="text-xs"
            style={{ fontFamily: 'var(--font-ui)', color: 'var(--color-text-3)' }}
          >
            Comparing {entries.length} setup{entries.length !== 1 ? 's' : ''}
          </p>
        )}

        <div
          className="rounded-lg p-4"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <SectionHeader>Thrust Envelope Comparison</SectionHeader>
          <ComparisonChart entries={entries} />
        </div>

        {entries.length > 0 && (
          <div>
            <SectionHeader>Performance Metrics</SectionHeader>
            <ComparisonTable entries={entries} />
          </div>
        )}
      </div>
    </div>
  )
}
