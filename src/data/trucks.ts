import type { CarSpec, CurvePoint } from '@/types/car'
import type { TruckModel, TruckPowertrain } from '@/types/truck'
import trucksData from './trucks.json'

/** US pickup catalog for the Towing page. See src/data/TRUCK_SOURCES.md for provenance. */
export const TRUCKS = trucksData as unknown as TruckModel[]

/**
 * Crank-to-wheel drivetrain loss for a 4x4 pickup
 * (torque-converter automatic + transfer case + solid axle).
 */
export const TRUCK_DRIVETRAIN_LOSS = 0.15

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
    },
    transmission: {
      gearRatios: powertrain.transmission.gearRatios,
      finalDriveRatio: axleRatio,
      shiftTimeMs: TRUCK_SHIFT_TIME_MS,
      drivetrainLoss: TRUCK_DRIVETRAIN_LOSS,
      type: powertrain.transmission.type,
    },
    tireSize: powertrain.tireSize,
    aero: truck.aero,
  }
}
