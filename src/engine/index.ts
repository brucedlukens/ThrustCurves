/**
 * Physics engine barrel export + top-level runSimulation() convenience function.
 * All modules are pure TypeScript with zero React dependencies.
 */

export { tireRadiusM, rollingResistanceN } from './tires'
export { dragForceN } from './aerodynamics'
export { airDensityAtAltitude, naPowerCorrection, turboPowerCorrection } from './altitude'
export { wheelTorqueNm, rpmToSpeedMs, speedMsToRpm } from './drivetrain'
export {
  effectiveTorqueCurve,
  interpolateGearThrust,
  interpolateEnvelope,
  computeGearThrustCurve,
  computeAllGearCurves,
  computeEnvelope,
  findShiftPoints,
} from './thrust'
export { runIntegration } from './performance'
export type { IntegrationParams } from './performance'

import type { CarSpec } from '@/types/car'
import type { CarModifications } from '@/types/config'
import type { SimulationResult } from '@/types/simulation'
import { DEFAULT_CRR, GRAVITY_MS2 } from '@/data/presets'
import { tireRadiusM } from './tires'
import { airDensityAtAltitude } from './altitude'
import { computeAllGearCurves, computeEnvelope, findShiftPoints } from './thrust'
import { runIntegration } from './performance'

/**
 * Run a full vehicle simulation given a base car spec and user modifications.
 *
 * Uses SI units throughout (m, s, N, kg). Display conversion happens at the UI layer.
 *
 * @param car    Base OEM CarSpec
 * @param mods   User modifications layered on top
 * @param crr    Rolling resistance coefficient (default: 0.015)
 * @param gravity Gravitational acceleration (default: 9.81 m/s²)
 */
export function runSimulation(
  car: CarSpec,
  mods: CarModifications,
  crr: number = DEFAULT_CRR,
  gravity: number = GRAVITY_MS2,
): SimulationResult {
  const altitude = mods.altitudeM
  const airDensity = airDensityAtAltitude(altitude)

  // Effective mass with weight modification (needed for traction limit)
  const massKg = car.curbWeightKg + mods.weightDeltaKg

  // Build gear thrust curves (applies mods + altitude correction)
  const gearCurves = computeAllGearCurves(car, mods)

  // Apply traction limit: cap thrust at μ × mass × g
  if (mods.tractionCoefficientMu !== undefined) {
    const maxThrustN = mods.tractionCoefficientMu * massKg * gravity
    for (const gc of gearCurves) {
      for (const pt of gc.points) {
        pt.forceN = Math.min(pt.forceN, maxThrustN)
      }
    }
  }

  // Build thrust envelope (max thrust at each speed across all gears)
  const envelope = computeEnvelope(gearCurves)

  // Find optimal shift points
  const shiftPoints = findShiftPoints(car, mods, gearCurves, envelope)

  // Aerodynamics
  const cd = mods.cdOverride ?? car.aero.cd
  const frontalAreaM2 = mods.frontalAreaOverride ?? car.aero.frontalAreaM2

  // Shift time
  const shiftTimeMs = mods.shiftTimeOverride ?? car.transmission.shiftTimeMs

  // Tire radius (with override)
  const radius = tireRadiusM(mods.tireSizeOverride ?? car.tireSize)

  // Effective gear ratios (gearRatio × finalDrive) for RPM computation in integration
  const finalDrive = mods.finalDriveOverride ?? car.transmission.finalDriveRatio
  const gearEffectiveRatios = car.transmission.gearRatios.map((ratio, i) => {
    const r = mods.gearRatioOverrides[i] ?? ratio
    return r * finalDrive
  })

  // Run numerical integration
  const { trace, performance } = runIntegration({
    envelope,
    gearCurves,
    shiftPoints,
    massKg,
    shiftTimeMs,
    crr,
    airDensityKgM3: airDensity,
    cd,
    frontalAreaM2,
    gravityMs2: gravity,
    gearEffectiveRatios,
    tireRadiusM: radius,
  })

  return { gearCurves, envelope, shiftPoints, performance, trace }
}
