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
}

function ChevronDown({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      className={`w-3.5 h-3.5 text-label transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function AccordionSection({ title, children, defaultOpen = true }: AccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="rounded-lg border border-line overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-lift hover:bg-raised transition-colors"
      >
        <span className="font-display text-[11px] font-semibold tracking-[0.2em] uppercase text-label">
          {title}
        </span>
        <ChevronDown isOpen={isOpen} />
      </button>
      {isOpen && (
        <div className="px-3 py-3 bg-panel flex flex-col gap-3">
          {children}
        </div>
      )}
    </div>
  )
}

export default function ModificationsPanel({ car }: ModificationsPanelProps) {
  const resetModifications = useCarStore(state => state.resetModifications)
  const modifications = useCarStore(state => state.modifications)

  const activeCount = [
    modifications.weightDeltaKg !== 0,
    modifications.torqueMultiplier !== 1.0,
    modifications.customTorqueCurve !== undefined,
    modifications.gearRatioOverrides.some(r => r !== undefined),
    modifications.finalDriveOverride !== undefined,
    modifications.shiftTimeOverride !== undefined,
    modifications.tireSizeOverride !== undefined,
    modifications.cdOverride !== undefined,
    modifications.frontalAreaOverride !== undefined,
    modifications.forcedInductionOverride !== undefined,
    modifications.altitudeM !== 0,
    modifications.tractionCoefficientMu !== undefined,
  ].filter(Boolean).length

  return (
    <div className="flex flex-col gap-2.5">
      {/* Panel header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="font-display text-[11px] font-semibold tracking-[0.2em] uppercase text-label">
            Modifications
          </span>
          {activeCount > 0 && (
            <span className="font-data text-[10px] px-1.5 py-0.5 rounded bg-signal-dim border border-signal/30 text-signal-hi">
              {activeCount} active
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={resetModifications}
            className="text-xs text-muted-txt hover:text-gray-300 underline underline-offset-2 transition-colors"
            aria-label="Reset all modifications to stock"
          >
            Reset All
          </button>
        )}
      </div>

      <AccordionSection title="Environment">
        <div className="flex flex-col gap-1">
          <label className="font-display text-[10px] font-semibold tracking-widest uppercase text-muted-txt">
            Altitude
          </label>
          <AltitudeSelector />
        </div>
      </AccordionSection>

      <AccordionSection title="Performance">
        <TorqueCurveEditor stockTorqueCurve={car.engine.torqueCurve} />
        <div className="flex flex-col gap-1">
          <label className="font-display text-[10px] font-semibold tracking-widest uppercase text-muted-txt">
            Weight Delta
          </label>
          <WeightEditor stockWeightKg={car.curbWeightKg} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-display text-[10px] font-semibold tracking-widest uppercase text-muted-txt">
            Traction Limit
          </label>
          <TractionEditor />
        </div>
      </AccordionSection>

      <AccordionSection title="Engine">
        <ForcedInductionToggle stockForcedInduction={car.engine.forcedInduction} />
      </AccordionSection>

      <AccordionSection title="Drivetrain">
        <GearRatioEditor
          stockGearRatios={car.transmission.gearRatios}
          stockFinalDrive={car.transmission.finalDriveRatio}
          stockShiftTimeMs={car.transmission.shiftTimeMs}
        />
      </AccordionSection>

      <AccordionSection title="Tires">
        <TireSizeEditor stockTireSize={car.tireSize} />
      </AccordionSection>

      <AccordionSection title="Aerodynamics">
        <AeroEditor stockCd={car.aero.cd} stockFrontalAreaM2={car.aero.frontalAreaM2} />
      </AccordionSection>
    </div>
  )
}
