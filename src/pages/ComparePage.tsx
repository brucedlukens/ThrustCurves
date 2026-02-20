import { useEffect } from 'react'
import { usePersistenceStore } from '@/store/persistenceStore'
import { useCarStore } from '@/store/carStore'
import { useComparison } from '@/hooks/useComparison'
import SavedConfigsList from '@/components/saved/SavedConfigsList'
import ComparisonChart from '@/components/charts/ComparisonChart'
import ComparisonTable from '@/components/results/ComparisonTable'

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span
        className="inline-block w-0.5 h-4 rounded-full"
        style={{ background: 'var(--accent)' }}
      />
      <h2
        className="font-display text-xs font-semibold tracking-widest uppercase"
        style={{ color: 'var(--text-secondary)' }}
      >
        {children}
      </h2>
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
    <div className="flex flex-col md:flex-row min-h-0 h-full">
      {/* Left: Setup selector */}
      <div
        className="w-full md:w-80 shrink-0 flex flex-col gap-4 overflow-y-auto p-5"
        style={{ borderRight: '1px solid var(--border)' }}
      >
        <div>
          <SectionLabel>Select Setups</SectionLabel>
          <p
            className="font-ui text-xs"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Toggle setups to overlay their thrust envelopes
          </p>
        </div>

        {isLoading && (
          <p className="font-ui text-sm" style={{ color: 'var(--text-secondary)' }}>
            Loading…
          </p>
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
            className="font-ui text-xs self-start transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)' }}
          >
            Clear selection
          </button>
        )}
      </div>

      {/* Right: Charts + Table */}
      <div className="flex-1 min-w-0 flex flex-col gap-6 overflow-y-auto p-6">
        {/* Page heading */}
        <div>
          <h1
            className="font-display text-2xl font-bold"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            Compare
          </h1>
          {entries.length > 0 && (
            <p
              className="font-ui text-sm mt-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              Overlaying{' '}
              <span style={{ color: 'var(--accent-text)' }}>
                {entries.length} setup{entries.length !== 1 ? 's' : ''}
              </span>
            </p>
          )}
        </div>

        {/* Comparison Chart */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'var(--surface-3)',
            border: '1px solid var(--border)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.4)',
          }}
        >
          <div
            className="px-5 pt-4 pb-3 flex items-center gap-3"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <span
              className="w-0.5 h-4 rounded-full"
              style={{ background: 'var(--accent)' }}
            />
            <h3
              className="font-display text-xs font-semibold tracking-widest uppercase"
              style={{ color: 'var(--accent-text)' }}
            >
              Thrust Envelope Comparison
            </h3>
          </div>
          <div className="p-4">
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
