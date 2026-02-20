import { useState } from 'react'
import { useCarStore } from '@/store/carStore'
import type { CarSpec } from '@/types/car'
import AltitudeSelector from './AltitudeSelector'
import WeightEditor from './WeightEditor'
import TorqueCurveEditor from './TorqueCurveEditor'
import GearRatioEditor from './GearRatioEditor'
import AeroEditor from './AeroEditor'
import TireSizeEditor from './TireSizeEditor'
import ForcedInductionToggle from './ForcedInductionToggle'
import TractionEditor from './TractionEditor'

interface ModificationsPanelProps {
  car: CarSpec
}

interface AccordionSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  activeCount?: number
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{
        transition: 'transform 0.2s',
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        color: 'var(--color-text-3)',
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function AccordionSection({ title, children, defaultOpen = false, activeCount = 0 }: AccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-1.5"
        aria-expanded={open}
      >
        <span
          className="text-[10px] uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-2)' }}
        >
          {title}
        </span>
        <div className="flex items-center gap-2">
          {!open && activeCount > 0 && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: 'rgba(245,158,11,0.15)',
                color: 'var(--color-accent)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {activeCount}
            </span>
          )}
          <ChevronIcon open={open} />
        </div>
      </button>
      {open && <div className="pt-2 pb-3">{children}</div>}
    </div>
  )
}

export default function ModificationsPanel({ car }: ModificationsPanelProps) {
  const resetModifications = useCarStore(state => state.resetModifications)
  const modifications = useCarStore(state => state.modifications)

  // Count active modifications per section
  const envActive = [modifications.altitudeM !== 0].filter(Boolean).length
  const perfActive = [
    modifications.weightDeltaKg !== 0,
    modifications.torqueMultiplier !== 1.0,
    modifications.customTorqueCurve !== undefined,
    modifications.tractionCoefficientMu !== undefined,
  ].filter(Boolean).length
  const engineActive = [modifications.forcedInductionOverride !== undefined].filter(Boolean).length
  const drivetrainActive = [
    modifications.gearRatioOverrides.some(r => r !== undefined),
    modifications.finalDriveOverride !== undefined,
    modifications.shiftTimeOverride !== undefined,
  ].filter(Boolean).length
  const tiresActive = [modifications.tireSizeOverride !== undefined].filter(Boolean).length
  const aeroActive = [
    modifications.cdOverride !== undefined,
    modifications.frontalAreaOverride !== undefined,
  ].filter(Boolean).length

  const totalActive = envActive + perfActive + engineActive + drivetrainActive + tiresActive + aeroActive

  return (
    <div className="flex flex-col gap-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-0.5 h-4 shrink-0" style={{ backgroundColor: 'var(--color-accent)' }} />
          <h2
            className="text-[10px] uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-3)' }}
          >
            Modifications
          </h2>
          {totalActive > 0 && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: 'rgba(245,158,11,0.15)',
                color: 'var(--color-accent)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {totalActive} active
            </span>
          )}
        </div>
        {totalActive > 0 && (
          <button
            onClick={resetModifications}
            className="text-[10px] underline"
            style={{ color: 'var(--color-text-3)' }}
            aria-label="Reset all modifications to stock"
          >
            Reset All
          </button>
        )}
      </div>

      <AccordionSection title="Environment" defaultOpen={true} activeCount={envActive}>
        <AltitudeSelector />
      </AccordionSection>

      <AccordionSection title="Performance" defaultOpen={true} activeCount={perfActive}>
        <TorqueCurveEditor stockTorqueCurve={car.engine.torqueCurve} />
        <div className="flex flex-col gap-1 mt-3">
          <label
            className="text-[10px] uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-3)' }}
          >
            Weight Delta
          </label>
          <WeightEditor stockWeightKg={car.curbWeightKg} />
        </div>
        <div className="flex flex-col gap-1 mt-3">
          <label
            className="text-[10px] uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-3)' }}
          >
            Traction Limit
          </label>
          <TractionEditor />
        </div>
      </AccordionSection>

      <AccordionSection title="Engine" defaultOpen={false} activeCount={engineActive}>
        <ForcedInductionToggle stockForcedInduction={car.engine.forcedInduction} />
      </AccordionSection>

      <AccordionSection title="Drivetrain" defaultOpen={false} activeCount={drivetrainActive}>
        <GearRatioEditor
          stockGearRatios={car.transmission.gearRatios}
          stockFinalDrive={car.transmission.finalDriveRatio}
          stockShiftTimeMs={car.transmission.shiftTimeMs}
        />
      </AccordionSection>

      <AccordionSection title="Tires" defaultOpen={false} activeCount={tiresActive}>
        <TireSizeEditor stockTireSize={car.tireSize} />
      </AccordionSection>

      <AccordionSection title="Aerodynamics" defaultOpen={false} activeCount={aeroActive}>
        <AeroEditor stockCd={car.aero.cd} stockFrontalAreaM2={car.aero.frontalAreaM2} />
      </AccordionSection>
    </div>
  )
}
