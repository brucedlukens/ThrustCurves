import type { AeroSpec, CurvePoint, TireSize, TransmissionType } from './car'

/** Truck class: half-ton (1500/150), three-quarter-ton (2500/250), one-ton (3500/350) */
export type TruckClassTier = 'half' | 'threequarter' | 'one'

export type FuelType = 'gas' | 'diesel' | 'ev'

export interface TruckTransmission {
  /** Marketing/OEM name, e.g. "10R80", "Allison 10L1000" */
  name: string
  /** Internal ratios, index 0 = 1st gear (excludes axle ratio) */
  gearRatios: number[]
  type: TransmissionType
}

/** One engine/transmission combination offered in a truck generation */
export interface TruckPowertrain {
  id: string
  /** Display name, e.g. "3.5L EcoBoost V6" */
  engineName: string
  fuel: FuelType
  yearStart: number
  /** null = still in production */
  yearEnd: number | null
  /** Crank torque curve: [rpm, Nm]. Power curve is derived (kW = Nm·rpm/9549). */
  torqueCurve: CurvePoint[]
  redlineRpm: number
  idleRpm: number
  displacementL: number
  forcedInduction: boolean
  transmission: TruckTransmission
  /** Factory-available axle (final drive) ratios */
  axleRatios: number[]
  defaultAxleRatio: number
  /** Curb weight for the baseline config (crew cab, 4x4, standard bed) with this engine */
  curbWeightKg: number
  tireSize: TireSize
  notes?: string
}

/** A truck model generation with its available powertrains */
export interface TruckModel {
  id: string
  make: string
  model: string
  classTier: TruckClassTier
  generation: string
  yearStart: number
  yearEnd: number | null
  aero: AeroSpec
  powertrains: TruckPowertrain[]
}

/** All generations of one nameplate (same make + model) */
export interface TruckFamily {
  /** Stable key derived from make + model, e.g. "ford-f-150" */
  key: string
  make: string
  model: string
  classTier: TruckClassTier
  /** Member generations sorted newest first */
  generations: TruckModel[]
}

export type TrailerCategory =
  | 'flatbed'
  | 'enclosed'
  | 'travel'
  | 'fifthwheel'
  | 'boat'
  | 'gooseneck'

export interface TrailerPreset {
  id: string
  name: string
  category: TrailerCategory
  /** Typical loaded mass used as the default */
  defaultMassKg: number
  massRangeKg: [number, number]
  /** Trailer frontal area in free stream */
  frontalAreaM2: number
  /** Standalone drag coefficient of the trailer body */
  cd: number
  /**
   * Fraction of the trailer's CdA that adds to the truck's (0–1).
   * Accounts for shielding by the truck's wake; fifth wheels get lower values.
   */
  exposureFactor: number
  /** Rolling resistance coefficient of the trailer's tires */
  crr: number
  description?: string
}

/** Trailer parameters as used by the physics engine (preset resolved + user edits) */
export interface TrailerLoad {
  massKg: number
  /** Effective drag area added to the truck: cd × frontalArea × exposureFactor */
  effectiveCdA: number
  crr: number
}

/** A towing scenario shared by all compared trucks */
export interface TowScenario {
  trailer: TrailerLoad
  /** Extra payload carried in the truck (people, tongue weight, bed cargo) */
  cargoMassKg: number
  altitudeM: number
  /** Road grade in percent (rise/run × 100). 0 = flat, positive = uphill. */
  gradePercent: number
  /** Speed to analyze, m/s */
  speedMs: number
}

/** One compared truck as selected in the Towing page UI */
export interface TowTruckSelection {
  truckId: string
  powertrainId: string
  axleRatio: number
  /** Overrides the powertrain's baseline curb weight when set */
  curbWeightOverrideKg?: number
}
