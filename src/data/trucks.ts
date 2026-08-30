import type { CarSpec, CurvePoint } from '@/types/car'
import type { TruckFamily, TruckModel, TruckPowertrain } from '@/types/truck'
import trucksData from './trucks.json'

/** US pickup catalog for the Towing page. See src/data/TRUCK_SOURCES.md for provenance. */
export const TRUCKS = trucksData as unknown as TruckModel[]

/**
 * Crank-to-wheel drivetrain loss for a 4x4 pickup
 * (torque-converter automatic + transfer case + solid axle).
 */
export const TRUCK_DRIVETRAIN_LOSS = 0.15

/** Motor-to-wheel loss for an EV's single-speed reduction (no converter, no transfer case) */
export const TRUCK_DRIVETRAIN_LOSS_EV = 0.08

/** Representative shift time for truck automatics under load */
export const TRUCK_SHIFT_TIME_MS = 400

export function findTruck(truckId: string): TruckModel | undefined {
  return TRUCKS.find((t) => t.id === truckId)
}

export function findPowertrain(
  truck: TruckModel,
  powertrainId: string,
): TruckPowertrain | undefined {
  return truck.powertrains.find((p) => p.id === powertrainId)
}

/** Stable family key for a nameplate, e.g. "ford-f-150" */
export function truckFamilyKey(truck: Pick<TruckModel, 'make' | 'model'>): string {
  return `${truck.make} ${truck.model}`.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

/** Group truck generations into families (same make + model), newest generation first */
export function buildTruckFamilies(trucks: TruckModel[]): TruckFamily[] {
  const families = new Map<string, TruckFamily>()
  for (const truck of trucks) {
    const key = truckFamilyKey(truck)
    const family = families.get(key)
    if (family) {
      family.generations.push(truck)
    } else {
      families.set(key, {
        key,
        make: truck.make,
        model: truck.model,
        classTier: truck.classTier,
        generations: [truck],
      })
    }
  }
  for (const family of families.values()) {
    family.generations.sort((a, b) => b.yearStart - a.yearStart)
  }
  return [...families.values()]
}

/** Truck catalog grouped by nameplate, in catalog order */
export const TRUCK_FAMILIES = buildTruckFamilies(TRUCKS)

export function findTruckFamily(key: string): TruckFamily | undefined {
  return TRUCK_FAMILIES.find((f) => f.key === key)
}

/** The family a given truck generation belongs to */
export function familyOfTruck(truckId: string): TruckFamily | undefined {
  return TRUCK_FAMILIES.find((f) => f.generations.some((g) => g.id === truckId))
}

/**
 * Carry a truck-card selection across a generation swap: keep the same engine
 * (matched by name, then by fuel + displacement) and the same axle ratio when
 * the target generation offers them, otherwise fall back to its defaults.
 */
export function carrySelectionToGeneration(
  target: TruckModel,
  prevPowertrain: TruckPowertrain | undefined,
  prevAxleRatio: number,
): { powertrainId: string; axleRatio: number } {
  const carried =
    (prevPowertrain &&
      (target.powertrains.find((p) => p.engineName === prevPowertrain.engineName) ??
        target.powertrains.find(
          (p) =>
            p.fuel === prevPowertrain.fuel && p.displacementL === prevPowertrain.displacementL,
        ))) ||
    target.powertrains[0]
  return {
    powertrainId: carried.id,
    axleRatio: carried.axleRatios.includes(prevAxleRatio)
      ? prevAxleRatio
      : carried.defaultAxleRatio,
  }
}

/**
 * Resolve a truck + powertrain + axle ratio selection into a CarSpec so the
 * existing simulation engine can run unchanged. The power curve is derived
 * from the crank torque curve (kW = Nm · rpm / 9549).
 */
export function resolveTruckToCarSpec(
  truck: TruckModel,
  powertrain: TruckPowertrain,
  axleRatio: number,
  curbWeightOverrideKg?: number,
): CarSpec {
  return {
    id: `${truck.id}__${powertrain.id}__${axleRatio}`,
    make: truck.make,
    model: truck.model,
    year: powertrain.yearStart,
    trim: powertrain.engineName,
    curbWeightKg: curbWeightOverrideKg ?? powertrain.curbWeightKg,
    drivetrain: 'AWD',
    engine: {
      torqueCurve: powertrain.torqueCurve,
      powerCurve: powertrain.torqueCurve.map(
        ([rpm, nm]): CurvePoint => [rpm, (nm * rpm) / 9549],
      ),
      redlineRpm: powertrain.redlineRpm,
      idleRpm: powertrain.idleRpm,
      displacementL: powertrain.displacementL,
      forcedInduction: powertrain.forcedInduction,
      electric: powertrain.fuel === 'ev',
    },
    transmission: {
      gearRatios: powertrain.transmission.gearRatios,
      finalDriveRatio: axleRatio,
      shiftTimeMs: TRUCK_SHIFT_TIME_MS,
      drivetrainLoss: powertrain.fuel === 'ev' ? TRUCK_DRIVETRAIN_LOSS_EV : TRUCK_DRIVETRAIN_LOSS,
      type: powertrain.transmission.type,
    },
    tireSize: powertrain.tireSize,
    aero: truck.aero,
  }
}
