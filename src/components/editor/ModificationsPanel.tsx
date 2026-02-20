import { useCarStore } from '@/store/carStore'
import type { CarSpec } from '@/types/car'
import AltitudeSelector from './AltitudeSelector'
import WeightEditor from './WeightEditor'
import TorqueCurveEditor from './TorqueCurveEditor'
import GearRatioEditor from './GearRatioEditor'
import AeroEditor from './AeroEditor'
import TireSizeEditor from './TireSizeEditor'
import ForcedInductionToggle from './ForcedInductionToggle'

interface ModificationsPanelProps {
  car: CarSpec
}

interface SectionProps {
  title: string
  children: React.ReactNode
}

function Section({ title, children }: SectionProps) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  )
}

export default function ModificationsPanel({ car }: ModificationsPanelProps) {
  const resetModifications = useCarStore(state => state.resetModifications)
  const modifications = useCarStore(state => state.modifications)

  // Count active modifications
  const activeCount = [
    modifications.weightDeltaKg !== 0,
    modifications.torqueMultiplier !== 1.0,
    modifications.customTorqueCurve !== undefined,
    modifications.gearRatioOverrides.some(r => r !== undefined),
    modifications.finalDriveOverride !== undefined,
    modifications.tireSizeOverride !== undefined,
    modifications.cdOverride !== undefined,
    modifications.frontalAreaOverride !== undefined,
    modifications.forcedInductionOverride !== undefined,
    modifications.altitudeM !== 0,
  ].filter(Boolean).length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Modifications{activeCount > 0 && (
            <span className="ml-2 text-indigo-400 normal-case font-normal">
              ({activeCount} active)
            </span>
          )}
        </h2>
        {activeCount > 0 && (
          <button
            onClick={resetModifications}
            className="text-xs text-gray-500 hover:text-gray-300 underline"
            aria-label="Reset all modifications to stock"
          >
            Reset All
          </button>
        )}
      </div>

      <Section title="Environment">
        <AltitudeSelector />
      </Section>

      <Section title="Performance">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Torque Multiplier</label>
          <TorqueCurveEditor />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Weight Delta</label>
          <WeightEditor stockWeightKg={car.curbWeightKg} />
        </div>
      </Section>

      <Section title="Engine">
        <ForcedInductionToggle stockForcedInduction={car.engine.forcedInduction} />
      </Section>

      <Section title="Drivetrain">
        <GearRatioEditor
          stockGearRatios={car.transmission.gearRatios}
          stockFinalDrive={car.transmission.finalDriveRatio}
        />
      </Section>

      <Section title="Tires">
        <TireSizeEditor stockTireSize={car.tireSize} />
      </Section>

      <Section title="Aerodynamics">
        <AeroEditor stockCd={car.aero.cd} stockFrontalAreaM2={car.aero.frontalAreaM2} />
      </Section>
    </div>
  )
}
