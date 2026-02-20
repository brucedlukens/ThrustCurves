import { useEffect } from 'react'
import { usePersistenceStore } from '@/store/persistenceStore'
import { useCarStore } from '@/store/carStore'
import { useComparison } from '@/hooks/useComparison'
import SavedConfigsList from '@/components/saved/SavedConfigsList'
import ComparisonChart from '@/components/charts/ComparisonChart'
import ComparisonTable from '@/components/results/ComparisonTable'

export default function ComparePage() {
  const { savedSetups, isLoading, loadSetups } = usePersistenceStore()
  const cars = useCarStore(state => state.cars)
  const { selectedIds, toggleSetup, clearSelection, entries } = useComparison()

  useEffect(() => {
    loadSetups()
  }, [loadSetups])

  return (
    <div className="flex gap-6 min-h-0 h-full">
      {/* Left: Setup selector */}
      <div className="w-72 shrink-0 flex flex-col gap-4 overflow-y-auto">
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Select Setups
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            Toggle setups to overlay their thrust envelopes
          </p>
        </div>

        {isLoading && <p className="text-gray-500 text-sm">Loading…</p>}

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
            className="text-xs text-gray-500 hover:text-gray-300 underline self-start"
          >
            Clear selection
          </button>
        )}
      </div>

      {/* Right: Charts + Table */}
      <div className="flex-1 min-w-0 flex flex-col gap-6 overflow-y-auto">
        <div>
          <h2 className="text-2xl font-semibold text-gray-100">Compare</h2>
          {entries.length > 0 && (
            <p className="text-gray-400 text-sm mt-1">
              Comparing {entries.length} setup{entries.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Thrust Envelope Comparison
          </h3>
          <ComparisonChart entries={entries} />
        </div>

        {entries.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Performance Metrics
            </h3>
            <ComparisonTable entries={entries} />
          </div>
        )}
      </div>
    </div>
  )
}
