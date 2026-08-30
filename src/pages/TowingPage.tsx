import { useMemo, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { TRAILER_PRESETS, trailerToLoad } from '@/data/trailers'
import {
  carrySelectionToGeneration,
  findPowertrain,
  findTruck,
  findTruckFamily,
  resolveTruckToCarSpec,
} from '@/data/trucks'
import { runTowingAnalysis } from '@/engine/towing'
import type { TowScenario } from '@/types/truck'
import { mphToMs } from '@/utils/units'
import type { TowTruckState, TowingEntry } from '@/components/towing/entry'
import { TOWING_COLORS } from '@/components/towing/entry'
import ScenarioPanel from '@/components/towing/ScenarioPanel'
import type { ScenarioState } from '@/components/towing/ScenarioPanel'
import TruckPicker from '@/components/towing/TruckPicker'
import TowingChart from '@/components/towing/TowingChart'
import TowingSummaryTable from '@/components/towing/TowingSummaryTable'
import TowingGearTable from '@/components/towing/TowingGearTable'

const DEFAULT_PRESET = TRAILER_PRESETS.find(p => p.id === 'travel-trailer-mid') ?? TRAILER_PRESETS[0]

const DEFAULT_SCENARIO: ScenarioState = {
  trailerPresetId: DEFAULT_PRESET.id,
  trailerMassKg: DEFAULT_PRESET.defaultMassKg,
  cargoMassKg: 136, // ~300 lb driver + gear
  altitudeM: 0,
  gradePercent: 0,
  speedMs: mphToMs(65),
}

interface SectionLabelProps {
  children: React.ReactNode
  hint?: string
}

function SectionLabel({ children, hint }: SectionLabelProps) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2">
        <div className="w-1 h-3.5 rounded-full bg-signal/60" />
        <span className="font-display text-[11px] font-semibold tracking-[0.2em] uppercase text-label">
          {children}
        </span>
      </div>
      {hint && (
        <p className="font-data text-[11px] text-muted-txt mt-1 ml-3 leading-snug">{hint}</p>
      )}
    </div>
  )
}

export default function TowingPage() {
  const [scenario, setScenario] = useState<ScenarioState>(DEFAULT_SCENARIO)
  const [selections, setSelections] = useState<TowTruckState[]>([])

  const addTruck = (familyKey: string) => {
    const family = findTruckFamily(familyKey)
    if (!family) return
    const truck = family.generations[0] // newest generation
    const powertrain = truck.powertrains[0]
    setSelections(prev => [
      ...prev,
      {
        key: uuidv4(),
        truckId: truck.id,
        powertrainId: powertrain.id,
        axleRatio: powertrain.defaultAxleRatio,
      },
    ])
  }

  const updateTruck = (key: string, patch: Partial<TowTruckState>) => {
    setSelections(prev =>
      prev.map(sel => {
        if (sel.key !== key) return sel
        const next = { ...sel, ...patch }
        if (patch.truckId && patch.truckId !== sel.truckId) {
          // Generation swap: keep the engine/axle when the new generation offers
          // them, and drop the weight override (baselines differ between gens)
          const newTruck = findTruck(patch.truckId)
          const prevTruck = findTruck(sel.truckId)
          const prevPowertrain = prevTruck ? findPowertrain(prevTruck, sel.powertrainId) : undefined
          if (newTruck) {
            const carried = carrySelectionToGeneration(newTruck, prevPowertrain, sel.axleRatio)
            next.powertrainId = carried.powertrainId
            next.axleRatio = carried.axleRatio
            next.weightOverrideKg = undefined
          }
        } else if (patch.powertrainId && patch.powertrainId !== sel.powertrainId) {
          // Changing engine resets axle ratio and weight to that powertrain's defaults
          const truck = findTruck(sel.truckId)
          const powertrain = truck ? findPowertrain(truck, patch.powertrainId) : undefined
          if (powertrain) {
            next.axleRatio = powertrain.defaultAxleRatio
            next.weightOverrideKg = undefined
          }
        }
        return next
      }),
    )
  }

  const removeTruck = (key: string) => {
    setSelections(prev => prev.filter(sel => sel.key !== key))
  }

  const towScenario = useMemo<TowScenario | null>(() => {
    const preset = TRAILER_PRESETS.find(p => p.id === scenario.trailerPresetId)
    if (!preset) return null
    return {
      trailer: trailerToLoad(preset, scenario.trailerMassKg),
      cargoMassKg: scenario.cargoMassKg,
      altitudeM: scenario.altitudeM,
      gradePercent: scenario.gradePercent,
      speedMs: scenario.speedMs,
    }
  }, [scenario])

  const entries = useMemo<TowingEntry[]>(() => {
    if (!towScenario) return []
    return selections.flatMap((sel, i) => {
      const truck = findTruck(sel.truckId)
      const powertrain = truck ? findPowertrain(truck, sel.powertrainId) : undefined
      if (!truck || !powertrain) return []
      try {
        const spec = resolveTruckToCarSpec(truck, powertrain, sel.axleRatio, sel.weightOverrideKg)
        const analysis = runTowingAnalysis(spec, towScenario, powertrain.fuel)
        return [
          {
            key: sel.key,
            name: `${truck.yearStart} ${truck.model} ${powertrain.engineName} ${sel.axleRatio.toFixed(2)}`,
            color: TOWING_COLORS[i % TOWING_COLORS.length],
            truck,
            powertrain,
            analysis,
          },
        ]
      } catch {
        return []
      }
    })
  }, [selections, towScenario])

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 min-h-0 h-full">
      {/* ── Left: Scenario + trucks ─────────────────────── */}
      <div className="lg:w-80 shrink-0 flex flex-col gap-4 lg:overflow-y-auto">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-gray-100 uppercase mb-0.5">
            Towing
          </h1>
          <p className="font-data text-xs text-muted-txt">
            Compare trucks pulling the same trailer up the same hill
          </p>
        </div>

        <div className="border-t border-faint pt-4">
          <SectionLabel>Scenario</SectionLabel>
          <ScenarioPanel scenario={scenario} onChange={patch => setScenario(prev => ({ ...prev, ...patch }))} />
        </div>

        <div className="border-t border-faint pt-4">
          <SectionLabel hint="Baseline weights are crew cab, 4x4, standard bed — edit to match other configs.">
            Trucks
          </SectionLabel>
          <TruckPicker
            selections={selections}
            onAdd={addTruck}
            onUpdate={updateTruck}
            onRemove={removeTruck}
          />
        </div>
      </div>

      {/* ── Right: Results ──────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col gap-5 lg:overflow-y-auto">
        {entries.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-signal animate-pulse" />
            <span className="font-display text-xs font-medium tracking-widest uppercase text-label">
              Comparing {entries.length} truck{entries.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        <div>
          <SectionLabel hint="Solid: max thrust through the gears. Dashed: force needed to hold speed with this trailer, grade, and altitude. The crossing is that truck's max sustainable speed.">
            Thrust vs. Road Load
          </SectionLabel>
          <div className="chart-frame p-4 h-[300px] lg:h-[380px]">
            <TowingChart entries={entries} speedMs={scenario.speedMs} />
          </div>
        </div>

        {entries.length > 0 && (
          <div>
            <SectionLabel hint="Cruising gear is the highest (lowest-RPM) gear that can hold the target speed on the scenario grade.">
              Towing Metrics
            </SectionLabel>
            <TowingSummaryTable entries={entries} />
          </div>
        )}

        {entries.length > 0 && (
          <div>
            <SectionLabel hint="Every gear at the target speed: wheel power available, surplus (+) or shortfall (−) vs. what the load requires, and the steepest grade that gear could hold.">
              Gears at Target Speed
            </SectionLabel>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {entries.map(entry => (
                <TowingGearTable key={entry.key} entry={entry} />
              ))}
            </div>
          </div>
        )}

        {entries.length > 0 && (
          <p className="font-data text-[10px] text-muted-txt leading-relaxed">
            Model notes: crank torque curves with 15% driveline loss (4x4, locked torque converter);
            turbo/diesel engines lose ~1%/1000 ft of altitude, naturally aspirated ~3%/1000 ft;
            trailer drag uses a shielding factor behind the truck; no thermal or tow-rating limits
            are modeled — this is a theoretical steady-state comparison. Sources and assumptions:
            src/data/TRUCK_SOURCES.md.
          </p>
        )}
      </div>
    </div>
  )
}
