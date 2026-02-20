import { useState } from 'react'
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

interface CollapsibleSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function CollapsibleSection({ title, children, defaultOpen = true }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between py-2"
      >
        <span className="font-display text-[11px] font-semibold tracking-[0.2em] uppercase text-label">
          {title}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-label transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && children}
    </div>
  )
}

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

export default function SimulatorPage() {
  useSimulation()

  const selectedCar = useCarStore(state => state.cars.find(c => c.id === state.selectedCarId))
  const result = useSimulationStore(state => state.result)
  const isRunning = useSimulationStore(state => state.isRunning)
  const error = useSimulationStore(state => state.error)

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 min-h-0 h-full">

      {/* ── Left Column: Controls ─────────────────────────── */}
      <div className="lg:w-80 shrink-0 flex flex-col gap-4 lg:overflow-y-auto">

        {/* Car Selection */}
        <div>
          <SectionLabel>Select Car</SectionLabel>
          <CarSearch />
        </div>

        {selectedCar && (
          <>
            {/* Specs — collapsible on mobile */}
            <div className="border-t border-faint pt-4">
              <CollapsibleSection title="Specifications" defaultOpen={false}>
                <div className="pb-2">
                  <CarSpecTable car={selectedCar} />
                </div>
              </CollapsibleSection>
            </div>

            {/* Modifications */}
            <div className="border-t border-faint pt-4">
              <ModificationsPanel car={selectedCar} />
            </div>
          </>
        )}
      </div>

      {/* ── Right Column: Results ─────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col gap-5 lg:overflow-y-auto">

        {!selectedCar && (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full border-2 border-line flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-muted-txt" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5l7.5-7.5 3 3 4.5-4.5M21 6v6h-6" />
              </svg>
            </div>
            <p className="font-display text-lg font-medium tracking-wider uppercase text-label">
              Select a car to begin
            </p>
            <p className="font-data text-sm text-muted-txt mt-1">
              Choose from the list on the left
            </p>
          </div>
        )}

        {selectedCar && isRunning && (
          <div className="flex items-center justify-center py-12 gap-3">
            <div className="w-2 h-2 rounded-full bg-signal animate-pulse" />
            <span className="font-display text-sm font-medium tracking-widest uppercase text-label">
              Running Simulation
            </span>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-signal/40 bg-signal-dim p-4">
            <p className="font-data text-sm text-signal-hi">{error}</p>
          </div>
        )}

        {result && selectedCar && !isRunning && (
          <>
            {/* Results header + save */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-signal animate-pulse" />
                <span className="font-display text-[11px] font-semibold tracking-[0.2em] uppercase text-label">
                  Simulation Results
                </span>
              </div>
              <SaveLoadControls carId={selectedCar.id} />
            </div>

            {/* Performance metrics — hero section */}
            <PerformanceCard performance={result.performance} />

            {/* Thrust Curve Chart */}
            <div>
              <SectionLabel>Thrust Curves</SectionLabel>
              <div className="chart-frame p-4 h-[280px] lg:h-[320px]">
                <ThrustCurveChart gearCurves={result.gearCurves} envelope={result.envelope} />
              </div>
            </div>

            {/* Power & Torque Chart */}
            <div>
              <SectionLabel>Power &amp; Torque</SectionLabel>
              <div className="chart-frame p-4 h-[240px] lg:h-[280px]">
                <PowerTorqueChart car={selectedCar} />
              </div>
            </div>

            {/* Shift Points */}
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
