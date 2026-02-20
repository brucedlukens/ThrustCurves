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

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      style={{
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.2s ease',
        color: 'var(--text-tertiary)',
      }}
    >
      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

interface AccordionSectionProps {
  title: string
  isActive?: boolean
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}

function AccordionSection({ title, isActive, isOpen, onToggle, children }: AccordionSectionProps) {
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        className="w-full flex items-center justify-between py-3 px-0 transition-colors"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          {isActive && (
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--accent)', boxShadow: '0 0 4px var(--accent)' }}
            />
          )}
          <span
            className="font-ui text-xs font-semibold tracking-widest uppercase"
            style={{ color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)' }}
          >
            {title}
          </span>
        </div>
        <ChevronIcon open={isOpen} />
      </button>

      <div
        className={isOpen ? 'section-body-open' : 'section-body-enter'}
        style={{ overflow: 'hidden' }}
      >
        <div className="pb-4 flex flex-col gap-3">
          {children}
        </div>
      </div>
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="font-ui text-xs tracking-wide uppercase"
      style={{ color: 'var(--text-tertiary)' }}
    >
      {children}
    </label>
  )
}

export default function ModificationsPanel({ car }: ModificationsPanelProps) {
  const resetModifications = useCarStore(state => state.resetModifications)
  const modifications = useCarStore(state => state.modifications)

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    environment: true,
    performance: true,
    engine: false,
    drivetrain: false,
    tires: false,
    aero: false,
  })

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const sectionActive = {
    environment: modifications.altitudeM !== 0,
    performance:
      modifications.weightDeltaKg !== 0 ||
      modifications.torqueMultiplier !== 1.0 ||
      modifications.customTorqueCurve !== undefined ||
      modifications.tractionCoefficientMu !== undefined,
    engine: modifications.forcedInductionOverride !== undefined,
    drivetrain:
      modifications.gearRatioOverrides.some(r => r !== undefined) ||
      modifications.finalDriveOverride !== undefined ||
      modifications.shiftTimeOverride !== undefined,
    tires: modifications.tireSizeOverride !== undefined,
    aero: modifications.cdOverride !== undefined || modifications.frontalAreaOverride !== undefined,
  }

  const activeCount = Object.values(sectionActive).filter(Boolean).length

  return (
    <div className="flex flex-col">
      {/* Panel header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <h2
            className="font-display text-xs font-semibold tracking-widest uppercase"
            style={{ color: 'var(--text-secondary)' }}
          >
            Modifications
          </h2>
          {activeCount > 0 && (
            <span
              className="font-data text-xs px-1.5 py-0.5 rounded"
              style={{
                background: 'var(--accent-glow)',
                color: 'var(--accent-text)',
                border: '1px solid var(--accent-dim)',
              }}
            >
              {activeCount} active
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={resetModifications}
            className="font-ui text-xs transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)' }}
            aria-label="Reset all modifications to stock"
          >
            Reset All
          </button>
        )}
      </div>

      {/* Accordion sections */}
      <AccordionSection
        title="Environment"
        isActive={sectionActive.environment}
        isOpen={openSections.environment}
        onToggle={() => toggleSection('environment')}
      >
        <AltitudeSelector />
      </AccordionSection>

      <AccordionSection
        title="Performance"
        isActive={sectionActive.performance}
        isOpen={openSections.performance}
        onToggle={() => toggleSection('performance')}
      >
        <TorqueCurveEditor stockTorqueCurve={car.engine.torqueCurve} />
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Weight Delta</FieldLabel>
          <WeightEditor stockWeightKg={car.curbWeightKg} />
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Traction Limit</FieldLabel>
          <TractionEditor />
        </div>
      </AccordionSection>

      <AccordionSection
        title="Engine"
        isActive={sectionActive.engine}
        isOpen={openSections.engine}
        onToggle={() => toggleSection('engine')}
      >
        <ForcedInductionToggle stockForcedInduction={car.engine.forcedInduction} />
      </AccordionSection>

      <AccordionSection
        title="Drivetrain"
        isActive={sectionActive.drivetrain}
        isOpen={openSections.drivetrain}
        onToggle={() => toggleSection('drivetrain')}
      >
        <GearRatioEditor
          stockGearRatios={car.transmission.gearRatios}
          stockFinalDrive={car.transmission.finalDriveRatio}
          stockShiftTimeMs={car.transmission.shiftTimeMs}
        />
      </AccordionSection>

      <AccordionSection
        title="Tires"
        isActive={sectionActive.tires}
        isOpen={openSections.tires}
        onToggle={() => toggleSection('tires')}
      >
        <TireSizeEditor stockTireSize={car.tireSize} />
      </AccordionSection>

      <AccordionSection
        title="Aerodynamics"
        isActive={sectionActive.aero}
        isOpen={openSections.aero}
        onToggle={() => toggleSection('aero')}
      >
        <AeroEditor stockCd={car.aero.cd} stockFrontalAreaM2={car.aero.frontalAreaM2} />
      </AccordionSection>
    </div>
  )
}
