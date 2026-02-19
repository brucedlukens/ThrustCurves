import type { CarSpec, CurvePoint } from '@/types/car'
import type { CarModifications } from '@/types/config'
import type { GearThrustCurve, EnvelopePoint, ShiftPoint, ThrustPoint } from '@/types/simulation'
import { tireRadiusM as calcTireRadius } from './tires'
import { wheelTorqueNm, rpmToSpeedMs, speedMsToRpm } from './drivetrain'
import { naPowerCorrection, turboPowerCorrection } from './altitude'
import { interpolate } from '@/utils/interpolation'

/** Speed sample interval for envelope and shift point computation (m/s) */
const SPEED_STEP_MS = 0.5

/**
 * Get effective engine torque curve after applying modifications and altitude correction.
 * Uses customTorqueCurve if provided, then applies torqueMultiplier and altitude factor.
 */
export function effectiveTorqueCurve(
  car: CarSpec,
  mods: CarModifications,
  powerCorrection: number,
): CurvePoint[] {
  const base: CurvePoint[] = mods.customTorqueCurve ?? car.engine.torqueCurve
  return base.map(([rpm, torque]): CurvePoint => [rpm, torque * mods.torqueMultiplier * powerCorrection])
}

/**
 * Interpolate thrust (N) from a GearThrustCurve at a given speed.
 * Clamps to the first/last point if speed is outside the curve's range.
 */
export function interpolateGearThrust(gear: GearThrustCurve, speedMs: number): number {
  const { points } = gear
  if (points.length === 0) return 0
  if (speedMs <= points[0].speedMs) return points[0].forceN
  if (speedMs >= points[points.length - 1].speedMs) return points[points.length - 1].forceN

  for (let i = 0; i < points.length - 1; i++) {
    if (speedMs >= points[i].speedMs && speedMs <= points[i + 1].speedMs) {
      const t = (speedMs - points[i].speedMs) / (points[i + 1].speedMs - points[i].speedMs)
      return points[i].forceN + t * (points[i + 1].forceN - points[i].forceN)
    }
  }

  return points[points.length - 1].forceN
}

/**
 * Compute thrust curve for a single gear.
 * Uses each RPM point in the torque curve to derive speed and thrust.
 */
export function computeGearThrustCurve(
  car: CarSpec,
  mods: CarModifications,
  gearIndex: number,
  torqueCurve: CurvePoint[],
  radius: number,
): GearThrustCurve {
  const gearRatio = mods.gearRatioOverrides[gearIndex] ?? car.transmission.gearRatios[gearIndex]
  const finalDrive = mods.finalDriveOverride ?? car.transmission.finalDriveRatio
  const drivetrainLoss = mods.drivetrainLossOverride ?? car.transmission.drivetrainLoss
  const { idleRpm, redlineRpm } = car.engine

  const points: ThrustPoint[] = torqueCurve
    .filter(([rpm]) => rpm >= idleRpm && rpm <= redlineRpm)
    .map(([rpm, engineTorque]): ThrustPoint => {
      const speedMs = rpmToSpeedMs(rpm, gearRatio, finalDrive, radius)
      const wTorque = wheelTorqueNm(engineTorque, gearRatio, finalDrive, drivetrainLoss)
      return { speedMs, forceN: wTorque / radius, rpm }
    })
    .sort((a, b) => a.speedMs - b.speedMs)

  return {
    gear: gearIndex + 1,
    points,
    speedRangeMs: [points[0]?.speedMs ?? 0, points[points.length - 1]?.speedMs ?? 0],
  }
}

/**
 * Compute thrust curves for all gears, applying modifications and altitude correction.
 */
export function computeAllGearCurves(car: CarSpec, mods: CarModifications): GearThrustCurve[] {
  const isForced = mods.forcedInductionOverride ?? car.engine.forcedInduction
  const powerCorrection = isForced
    ? turboPowerCorrection(mods.altitudeM)
    : naPowerCorrection(mods.altitudeM)
  const torqueCurve = effectiveTorqueCurve(car, mods, powerCorrection)
  const radius = calcTireRadius(mods.tireSizeOverride ?? car.tireSize)

  return car.transmission.gearRatios.map((_, i) =>
    computeGearThrustCurve(car, mods, i, torqueCurve, radius),
  )
}

/**
 * Build the thrust envelope: the maximum available thrust at each speed
 * across all gears. Sampled at SPEED_STEP_MS intervals.
 */
export function computeEnvelope(gearCurves: GearThrustCurve[]): EnvelopePoint[] {
  if (gearCurves.length === 0) return []

  const maxSpeed = Math.max(...gearCurves.map((gc) => gc.speedRangeMs[1]))
  const envelope: EnvelopePoint[] = []

  for (let speed = 0; speed <= maxSpeed + SPEED_STEP_MS / 2; speed += SPEED_STEP_MS) {
    let bestThrust = 0
    let bestGear = 1

    for (const gc of gearCurves) {
      // Skip gears that can't reach this speed
      if (speed > gc.speedRangeMs[1] + SPEED_STEP_MS) continue
      const thrust = interpolateGearThrust(gc, speed)
      if (thrust > bestThrust) {
        bestThrust = thrust
        bestGear = gc.gear
      }
    }

    if (bestThrust > 0) {
      envelope.push({ speedMs: speed, forceN: bestThrust, gear: bestGear })
    }
  }

  return envelope
}

/**
 * Interpolate thrust (N) from the envelope at a given speed.
 * Returns 0 if speed is outside the envelope's range.
 */
export function interpolateEnvelope(envelope: EnvelopePoint[], speedMs: number): number {
  if (envelope.length === 0) return 0

  const curve: CurvePoint[] = envelope.map((p) => [p.speedMs, p.forceN])
  if (speedMs > envelope[envelope.length - 1].speedMs) return 0
  return interpolate(curve, speedMs)
}

/**
 * Find optimal shift points between consecutive gears.
 * A shift point is where the next gear begins to produce more thrust
 * than the current gear at the same speed.
 */
export function findShiftPoints(
  car: CarSpec,
  mods: CarModifications,
  gearCurves: GearThrustCurve[],
  envelope: EnvelopePoint[],
): ShiftPoint[] {
  const radius = calcTireRadius(mods.tireSizeOverride ?? car.tireSize)
  const finalDrive = mods.finalDriveOverride ?? car.transmission.finalDriveRatio
  const shiftPoints: ShiftPoint[] = []

  for (let i = 0; i < gearCurves.length - 1; i++) {
    const fromGearNum = i + 1
    const toGearNum = i + 2
    const fromGearRatio = mods.gearRatioOverrides[i] ?? car.transmission.gearRatios[i]

    // Find where the envelope transitions from fromGear to toGear,
    // but only within the current gear's valid speed range.
    let shiftSpeed: number | null = null
    const fromGearMaxSpeed = gearCurves[i].speedRangeMs[1]

    for (let j = 1; j < envelope.length; j++) {
      if (
        envelope[j - 1].gear === fromGearNum &&
        envelope[j].gear === toGearNum &&
        envelope[j - 1].speedMs <= fromGearMaxSpeed
      ) {
        shiftSpeed = (envelope[j - 1].speedMs + envelope[j].speedMs) / 2
        // Clamp to gear's max speed so RPM stays at or below redline
        shiftSpeed = Math.min(shiftSpeed, fromGearMaxSpeed)
        break
      }
    }

    // If no envelope transition found, shift at the current gear's redline speed
    if (shiftSpeed === null) {
      shiftSpeed = fromGearMaxSpeed
    }

    const rpm = speedMsToRpm(shiftSpeed, fromGearRatio, finalDrive, radius)
    shiftPoints.push({ fromGear: fromGearNum, toGear: toGearNum, speedMs: shiftSpeed, rpm })
  }

  return shiftPoints
}
