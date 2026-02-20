import { useMemo, useState } from 'react'
import { usePersistenceStore } from '@/store/persistenceStore'
import { useCarStore } from '@/store/carStore'
import { runSimulation } from '@/engine'
import type { SimulationResult } from '@/types/simulation'
import type { SavedSetup } from '@/types/config'

export interface ComparisonEntry {
  setup: SavedSetup
  result: SimulationResult
}

export interface UseComparisonReturn {
  selectedIds: string[]
  toggleSetup: (id: string) => void
  clearSelection: () => void
  entries: ComparisonEntry[]
}

/**
 * Manages a set of saved setups selected for side-by-side comparison.
 * Runs simulations for each selected setup and returns the results.
 */
export function useComparison(): UseComparisonReturn {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const savedSetups = usePersistenceStore(state => state.savedSetups)
  const cars = useCarStore(state => state.cars)

  const toggleSetup = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const clearSelection = () => setSelectedIds([])

  const entries = useMemo<ComparisonEntry[]>(() => {
    const results: ComparisonEntry[] = []
    for (const id of selectedIds) {
      const setup = savedSetups.find(s => s.id === id)
      if (!setup) continue
      const car = cars.find(c => c.id === setup.carId)
      if (!car) continue
      try {
        const result = runSimulation(car, setup.modifications)
        results.push({ setup, result })
      } catch {
        // Skip setups that fail to simulate (shouldn't happen with valid data)
      }
    }
    return results
  }, [selectedIds, savedSetups, cars])

  return { selectedIds, toggleSetup, clearSelection, entries }
}
