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

function ChartContainer({ title, children }: { title: string; children: React.ReactNode }) {
  return (
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
          {title}
        </h3>
      </div>
      <div className="p-4">
        {children}
      </div>
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
    <div className="flex flex-col md:flex-row min-h-0 h-full">
      {/* Left: Car Selection + Modifications */}
      <div
        className="w-full md:w-80 shrink-0 flex flex-col overflow-y-auto"
        style={{ borderRight: '1px solid var(--border)' }}
      >
        {/* Car Selection */}
        <div
          className="p-5"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <SectionLabel>Select Vehicle</SectionLabel>
          <CarSearch />
        </div>

        {selectedCar && (
          <>
            {/* Specs */}
            <div
              className="p-5"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <SectionLabel>Specifications</SectionLabel>
              <CarSpecTable car={selectedCar} />
            </div>

            {/* Modifications */}
            <div className="p-5">
              <ModificationsPanel car={selectedCar} />
            </div>
          </>
        )}
      </div>

      {/* Right: Charts + Results */}
      <div className="flex-1 min-w-0 overflow-y-auto p-6 flex flex-col gap-6">
        {!selectedCar && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-24">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--accent)' }}>
                <path d="M3 18 Q7 6 12 10 Q17 14 21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="10" r="2.5" fill="currentColor" opacity="0.6" />
              </svg>
            </div>
            <div className="text-center">
              <p
                className="font-display text-base font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                Select a vehicle
              </p>
              <p
                className="font-ui text-sm mt-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Choose a car from the panel to begin simulation
              </p>
            </div>
          </div>
        )}

        {selectedCar && isRunning && (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-8 h-8 rounded-full border-2 animate-spin"
                style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
              />
              <p
                className="font-data text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Computing simulation…
              </p>
            </div>
          </div>
        )}

        {error && (
          <div
            className="rounded-lg p-4 font-ui text-sm"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: 'var(--danger)',
            }}
          >
            {error}
          </div>
        )}

        {result && selectedCar && !isRunning && (
          <>
            {/* Results header with save control */}
            <div className="flex items-center justify-between">
              <SectionLabel>Simulation Results</SectionLabel>
              <SaveLoadControls carId={selectedCar.id} />
            </div>

            <ChartContainer title="Thrust Curves — Speed vs Force">
              <ThrustCurveChart gearCurves={result.gearCurves} envelope={result.envelope} />
            </ChartContainer>

            <ChartContainer title="Power &amp; Torque — Engine Curve">
              <PowerTorqueChart car={selectedCar} />
            </ChartContainer>

            <PerformanceCard performance={result.performance} />

            <div>
              <SectionLabel>Optimal Shift Points</SectionLabel>
              <ShiftPointsTable shiftPoints={result.shiftPoints} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
