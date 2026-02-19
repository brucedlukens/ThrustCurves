import { useSimulation } from '@/hooks/useSimulation'
import { useCarStore } from '@/store/carStore'
import { useSimulationStore } from '@/store/simulationStore'
import CarSearch from '@/components/car-selector/CarSearch'
import CarSpecTable from '@/components/car-selector/CarSpecTable'
import ThrustCurveChart from '@/components/charts/ThrustCurveChart'
import PowerTorqueChart from '@/components/charts/PowerTorqueChart'
import PerformanceCard from '@/components/results/PerformanceCard'
import ShiftPointsTable from '@/components/results/ShiftPointsTable'

export default function SimulatorPage() {
  useSimulation()

  const selectedCar = useCarStore(state => state.cars.find(c => c.id === state.selectedCarId))
  const result = useSimulationStore(state => state.result)
  const isRunning = useSimulationStore(state => state.isRunning)
  const error = useSimulationStore(state => state.error)

  return (
    <div className="flex gap-6 min-h-0 h-full">
      {/* Left: Car Selection */}
      <div className="w-72 shrink-0 flex flex-col gap-5 overflow-y-auto">
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Select Car
          </h2>
          <CarSearch />
        </div>
        {selectedCar && (
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Specifications
            </h2>
            <CarSpecTable car={selectedCar} />
          </div>
        )}
      </div>

      {/* Right: Charts + Results */}
      <div className="flex-1 min-w-0 flex flex-col gap-6 overflow-y-auto">
        {!selectedCar && (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a car to begin simulation
          </div>
        )}

        {selectedCar && isRunning && (
          <div className="flex items-center justify-center py-12 text-gray-500">
            Running simulation…
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-700 bg-red-900/20 p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {result && selectedCar && !isRunning && (
          <>
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Thrust Curves
              </h2>
              <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
                <ThrustCurveChart gearCurves={result.gearCurves} envelope={result.envelope} />
              </div>
            </div>

            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Power &amp; Torque
              </h2>
              <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
                <PowerTorqueChart car={selectedCar} />
              </div>
            </div>

            <PerformanceCard performance={result.performance} />

            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Optimal Shift Points
              </h2>
              <ShiftPointsTable shiftPoints={result.shiftPoints} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
