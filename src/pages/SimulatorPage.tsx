import { useSimulation } from '@/hooks/useSimulation'
import { useCarStore } from '@/store/carStore'
import { useSimulationStore } from '@/store/simulationStore'
import CarSearch from '@/components/car-selector/CarSearch'
import CarSpecTable from '@/components/car-selector/CarSpecTable'
import ThrustCurveChart from '@/components/charts/ThrustCurveChart'
import PowerTorqueChart from '@/components/charts/PowerTorqueChart'
import PerformanceCard from '@/components/results/PerformanceCard'
import ShiftPointsTable from '@/components/results/ShiftPointsTable'
import ModificationsPanel from '@/components/editor/ModificationsPanel'
import SaveLoadControls from '@/components/saved/SaveLoadControls'

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-0.5 h-4 shrink-0" style={{ backgroundColor: 'var(--color-accent)' }} />
      <h2
        className="text-[10px] uppercase tracking-widest"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-3)' }}
      >
        {children}
      </h2>
    </div>
  )
}

function ChartContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-lg p-3 md:p-4"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      {children}
    </div>
  )
}

export default function SimulatorPage() {
  useSimulation()

  const selectedCar = useCarStore(state => state.cars.find(c => c.id === state.selectedCarId))
  const result = useSimulationStore(state => state.result)
  const isRunning = useSimulationStore(state => state.isRunning)
  const error = useSimulationStore(state => state.error)

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 min-h-0 h-full">
      {/* Left: Car Selection + Modifications */}
      <div className="md:w-72 md:shrink-0 flex flex-col gap-5 md:overflow-y-auto">
        <div>
          <SectionHeader>Select Car</SectionHeader>
          <CarSearch />
        </div>
        {selectedCar && (
          <>
            <div>
              <SectionHeader>Specifications</SectionHeader>
              <CarSpecTable car={selectedCar} />
            </div>
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
              <ModificationsPanel car={selectedCar} />
            </div>
          </>
        )}
      </div>

      {/* Right: Charts + Results */}
      <div className="flex-1 min-w-0 flex flex-col gap-5 md:gap-6 overflow-y-auto">
        {!selectedCar && (
          <div
            className="flex-1 flex items-center justify-center text-sm py-12"
            style={{ color: 'var(--color-text-3)' }}
          >
            Select a car to begin simulation
          </div>
        )}

        {selectedCar && isRunning && (
          <div
            className="flex items-center justify-center py-12 text-sm"
            style={{ color: 'var(--color-text-3)' }}
          >
            Running simulation…
          </div>
        )}

        {error && (
          <div
            className="rounded-lg p-4 text-sm"
            style={{
              border: '1px solid var(--color-danger)',
              backgroundColor: 'rgba(239,68,68,0.1)',
              color: 'var(--color-danger)',
            }}
          >
            {error}
          </div>
        )}

        {result && selectedCar && !isRunning && (
          <>
            <div className="flex items-center justify-between">
              <SectionHeader>Simulation Results</SectionHeader>
              <SaveLoadControls carId={selectedCar.id} />
            </div>

            <div>
              <SectionHeader>Thrust Curves</SectionHeader>
              <ChartContainer>
                <ThrustCurveChart gearCurves={result.gearCurves} envelope={result.envelope} />
              </ChartContainer>
            </div>

            <div>
              <SectionHeader>Power &amp; Torque</SectionHeader>
              <ChartContainer>
                <PowerTorqueChart car={selectedCar} />
              </ChartContainer>
            </div>

            <PerformanceCard performance={result.performance} />

            <div>
              <SectionHeader>Optimal Shift Points</SectionHeader>
              <ShiftPointsTable shiftPoints={result.shiftPoints} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
