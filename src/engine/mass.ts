import type { CarSpec } from '@/types/car'
import type { CarModifications } from '@/types/config'
import { DEFAULT_DRIVER_MASS_KG } from '@/data/presets'

/** Driver mass for a setup: the override, or the ≈200 lb default. */
export function driverMassKg(mods: Pick<CarModifications, 'driverMassKg'>): number {
  return mods.driverMassKg ?? DEFAULT_DRIVER_MASS_KG
}

/**
 * Mass used by every simulation: curb weight + driver + weight delta.
 * The driver is always on board — a car never runs a course empty.
 */
export function vehicleMassKg(car: Pick<CarSpec, 'curbWeightKg'>, mods: Pick<CarModifications, 'driverMassKg' | 'weightDeltaKg'>): number {
  return car.curbWeightKg + driverMassKg(mods) + mods.weightDeltaKg
}
