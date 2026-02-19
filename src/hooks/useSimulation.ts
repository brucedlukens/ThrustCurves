import { useEffect } from 'react'
import { useCarStore } from '@/store/carStore'
import { useSimulationStore } from '@/store/simulationStore'
import { runSimulation } from '@/engine'

/**
 * Runs the physics simulation reactively whenever the selected car or modifications change.
 * Updates the simulation store with results or error state.
 *
 * Must be called once in a top-level layout component (e.g. SimulatorPage).
 */
export function useSimulation(): void {
  const cars = useCarStore(state => state.cars)
  const selectedCarId = useCarStore(state => state.selectedCarId)
  const modifications = useCarStore(state => state.modifications)
  const setResult = useSimulationStore(state => state.setResult)
  const setRunning = useSimulationStore(state => state.setRunning)
  const setError = useSimulationStore(state => state.setError)
  const clearResult = useSimulationStore(state => state.clearResult)

  useEffect(() => {
    const car = cars.find(c => c.id === selectedCarId)
    if (!car) {
      clearResult()
      return
    }

    setRunning(true)
    try {
      const result = runSimulation(car, modifications)
      setResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed')
    } finally {
      setRunning(false)
    }
  }, [cars, selectedCarId, modifications, setResult, setRunning, setError, clearResult])
}
