import type { GearThrustCurve, EnvelopePoint, ShiftPoint, TimeStep, PerformanceMetrics } from '@/types/simulation'
import { dragForceN } from './aerodynamics'
import { rollingResistanceN } from './tires'
import { speedMsToRpm } from './drivetrain'
import { interpolateGearThrust } from './thrust'

/** Euler integration time step (seconds) */
const DT = 0.01

/** Maximum simulation duration (seconds) */
const MAX_TIME = 90

/** 60 mph in m/s */
const SPEED_60MPH_MS = 26.8224

/** 100 km/h in m/s */
const SPEED_100KMH_MS = 100 / 3.6

/** Quarter mile in meters */
const DISTANCE_QUARTER_MILE_M = 402.336

export interface IntegrationParams {
  envelope: EnvelopePoint[]
  gearCurves: GearThrustCurve[]
  shiftPoints: ShiftPoint[]
  massKg: number
  shiftTimeMs: number
  crr: number
  airDensityKgM3: number
  cd: number
  frontalAreaM2: number
  gravityMs2: number
  /** Effective ratio (gearRatio * finalDriveRatio) for each gear, index 0 = 1st gear */
  gearEffectiveRatios: number[]
  tireRadiusM: number
}

/**
 * Run Euler numerical integration to simulate vehicle acceleration.
 * Returns a time-step trace and extracted performance metrics.
 */
export function runIntegration(params: IntegrationParams): {
  trace: TimeStep[]
  performance: PerformanceMetrics
} {
  const {
    gearCurves,
    shiftPoints,
    massKg,
    shiftTimeMs,
    crr,
    airDensityKgM3,
    cd,
    frontalAreaM2,
    gravityMs2,
    gearEffectiveRatios,
    tireRadiusM,
  } = params

  const rrN = rollingResistanceN(massKg, crr, gravityMs2)

  // Sort shift points by speed ascending
  const sortedShifts = [...shiftPoints].sort((a, b) => a.speedMs - b.speedMs)

  let time = 0
  let speed = 0
  let distance = 0
  let gear = 1
  let shiftTimeRemaining = 0
  let shiftIndex = 0

  const trace: TimeStep[] = []
  const performance: PerformanceMetrics = {}

  // Determine top speed: highest speed where envelope thrust exceeds drag + rolling resistance.
  // This gives the realistic drag-limited equilibrium speed rather than the gearing ceiling.
  let topSpeedMs = 0
  for (const pt of params.envelope) {
    const drag = dragForceN(cd, frontalAreaM2, airDensityKgM3, pt.speedMs)
    if (pt.forceN > drag + rrN) {
      topSpeedMs = pt.speedMs
    }
  }
  performance.topSpeedMs = topSpeedMs

  while (time < MAX_TIME) {
    let thrustN = 0

    if (shiftTimeRemaining > 0) {
      // Gear change in progress — no thrust
      shiftTimeRemaining = Math.max(0, shiftTimeRemaining - DT)
    } else {
      // Check whether to upshift
      while (
        shiftIndex < sortedShifts.length &&
        speed >= sortedShifts[shiftIndex].speedMs
      ) {
        gear = sortedShifts[shiftIndex].toGear
        shiftIndex++
        shiftTimeRemaining = Math.max(0, shiftTimeMs / 1000 - DT)
        break
      }

      if (shiftTimeRemaining <= 0) {
        // Look up thrust from the current gear's curve
        const gc = gearCurves.find((g) => g.gear === gear)
        thrustN = gc ? interpolateGearThrust(gc, speed) : 0
      }
    }

    const dragN = dragForceN(cd, frontalAreaM2, airDensityKgM3, speed)
    const netForceN = thrustN - dragN - rrN
    const acc = netForceN / massKg

    // Current engine RPM
    const ratioIdx = gear - 1
    const effectiveRatio = gearEffectiveRatios[ratioIdx] ?? gearEffectiveRatios[gearEffectiveRatios.length - 1]
    const rpm = speedMsToRpm(speed, 1, 1, tireRadiusM / effectiveRatio)

    trace.push({
      timeS: time,
      speedMs: speed,
      distanceM: distance,
      accelerationMs2: acc,
      gear,
      rpm: Math.round(rpm),
      thrustN,
      dragN,
      netForceN,
    })

    // Extract metrics when thresholds are crossed
    if (performance.zeroTo60Mph === undefined && speed >= SPEED_60MPH_MS) {
      performance.zeroTo60Mph = time
    }
    if (performance.zeroTo100Kmh === undefined && speed >= SPEED_100KMH_MS) {
      performance.zeroTo100Kmh = time
    }
    if (performance.quarterMileS === undefined && distance >= DISTANCE_QUARTER_MILE_M) {
      performance.quarterMileS = time
      performance.quarterMileSpeedMs = speed
    }

    // Early exit once all key metrics are captured
    if (
      performance.zeroTo60Mph !== undefined &&
      performance.zeroTo100Kmh !== undefined &&
      performance.quarterMileS !== undefined
    ) {
      break
    }

    // Update state using Euler integration
    speed = Math.max(0, speed + acc * DT)
    distance += speed * DT
    time += DT
  }

  return { trace, performance }
}
