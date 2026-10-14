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

/** A held gear drops out below this fraction of its minimum speed (hysteresis against hunting) */
const HOLD_DROP_FRACTION = 0.9

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
  /** Road grade in percent (rise/run × 100). Default 0 (flat). */
  gradePercent?: number
  /** Starting speed in m/s (e.g. for passing-time runs). Default 0. */
  initialSpeedMs?: number
  /** End the run once this speed is reached. Default: run to top speed. */
  stopAtSpeedMs?: number
  /**
   * Stay in this gear whenever it can run at or above `holdGearMinRpm`. Below
   * that, lower gears shift normally and the held gear is taken as soon as it
   * becomes usable. In the held gear the rev limiter cuts drive force above
   * redline. Default: normal shifting through every gear.
   */
  holdGear?: number
  /** Lowest rpm the held gear may run at (e.g. a lugging floor). Default 0: the torque curve's start. */
  holdGearMinRpm?: number
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
    gradePercent = 0,
    initialSpeedMs = 0,
    stopAtSpeedMs,
    holdGear,
    holdGearMinRpm = 0,
  } = params

  const gradeAngle = Math.atan(gradePercent / 100)
  const rrN = rollingResistanceN(massKg, crr, gravityMs2) * Math.cos(gradeAngle)
  const gradeForceN = massKg * gravityMs2 * Math.sin(gradeAngle)

  // Held gear: the speed where it reaches its minimum rpm (rpm ∝ speed within a gear)
  const holdCurve = holdGear !== undefined ? gearCurves.find((g) => g.gear === holdGear) : undefined
  const holdStart = holdCurve?.points[0]
  const holdMinSpeedMs =
    holdStart && holdStart.rpm > 0
      ? holdStart.speedMs * (Math.max(holdGearMinRpm, holdStart.rpm) / holdStart.rpm)
      : Infinity

  // Sort shift points by speed ascending; with a held gear only shifts below it apply
  const sortedShifts = [...shiftPoints]
    .filter((sp) => !holdCurve || sp.toGear < holdCurve.gear)
    .sort((a, b) => a.speedMs - b.speedMs)

  /** Normal-shifting gear at a speed, and the index of the next shift above it */
  const shiftedGearAt = (v: number): { gear: number; shiftIndex: number } => {
    let g = 1
    let i = 0
    while (i < sortedShifts.length && sortedShifts[i].speedMs <= v) {
      g = sortedShifts[i].toGear
      i++
    }
    return { gear: g, shiftIndex: i }
  }

  let time = 0
  let speed = initialSpeedMs
  let distance = 0
  let shiftTimeRemaining = 0

  // Enter the starting gear directly: the held gear if it's usable, else the normal one
  let { gear, shiftIndex } = shiftedGearAt(speed)
  if (holdCurve && speed >= holdMinSpeedMs) gear = holdCurve.gear

  const trace: TimeStep[] = []
  const performance: PerformanceMetrics = {}

  // Determine top speed: highest speed where envelope thrust exceeds drag + rolling resistance.
  // This gives the realistic drag-limited equilibrium speed rather than the gearing ceiling.
  // With a held gear: lower gears below its minimum speed, the held gear above it.
  const topSpeedPoints = holdCurve
    ? [
        ...gearCurves
          .filter((g) => g.gear < holdCurve.gear)
          .flatMap((g) => g.points.filter((pt) => pt.speedMs < holdMinSpeedMs)),
        ...holdCurve.points.filter((pt) => pt.speedMs >= holdMinSpeedMs),
      ]
    : params.envelope
  let topSpeedMs = 0
  for (const pt of topSpeedPoints) {
    const drag = dragForceN(cd, frontalAreaM2, airDensityKgM3, pt.speedMs)
    if (pt.forceN > drag + rrN + gradeForceN) {
      topSpeedMs = Math.max(topSpeedMs, pt.speedMs)
    }
  }
  performance.topSpeedMs = topSpeedMs

  while (time < MAX_TIME) {
    let thrustN = 0

    if (shiftTimeRemaining > 0) {
      // Gear change in progress — no thrust
      shiftTimeRemaining = Math.max(0, shiftTimeRemaining - DT)
    } else {
      const startShift = () => {
        shiftTimeRemaining = Math.max(0, shiftTimeMs / 1000 - DT)
      }

      if (holdCurve && gear !== holdCurve.gear && speed >= holdMinSpeedMs) {
        // The held gear just became usable: go straight to it
        gear = holdCurve.gear
        startShift()
      } else if (holdCurve && gear === holdCurve.gear && speed < holdMinSpeedMs * HOLD_DROP_FRACTION) {
        // Too slow for the held gear: drop to the normal gear for this speed
        const lower = shiftedGearAt(speed)
        if (lower.gear !== gear) {
          gear = lower.gear
          shiftIndex = lower.shiftIndex
          startShift()
        }
      } else if (!holdCurve || gear !== holdCurve.gear) {
        // Check whether to upshift
        while (
          shiftIndex < sortedShifts.length &&
          speed >= sortedShifts[shiftIndex].speedMs
        ) {
          gear = sortedShifts[shiftIndex].toGear
          shiftIndex++
          startShift()
          break
        }
      }

      if (shiftTimeRemaining <= 0) {
        // Look up thrust from the current gear's curve; the rev limiter cuts it
        // above redline in a held gear
        const gc = gearCurves.find((g) => g.gear === gear)
        const revLimited = gc !== undefined && gc === holdCurve && speed > gc.speedRangeMs[1]
        thrustN = gc && !revLimited ? interpolateGearThrust(gc, speed) : 0
      }
    }

    const dragN = dragForceN(cd, frontalAreaM2, airDensityKgM3, speed)
    const netForceN = thrustN - dragN - rrN - gradeForceN
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

    // Stop once the requested target speed is reached (passing-time runs)
    if (stopAtSpeedMs !== undefined && speed >= stopAtSpeedMs) {
      break
    }

    // Continue until speed plateaus within 1% of drag-limited top speed.
    // This ensures the trace covers the full acceleration run to top speed,
    // which is needed for AccelerationChart and CustomRangePanel above quarter-mile speeds.
    // With a stop target at or below top speed, keep going until the target is reached.
    // A rolling start above top speed (e.g. a grade it can't hold) decelerates
    // until it settles into the same band from above.
    if (topSpeedMs > 0 && speed >= topSpeedMs * 0.99 && speed <= topSpeedMs * 1.01) {
      if (stopAtSpeedMs === undefined || stopAtSpeedMs > topSpeedMs) {
        break
      }
    }

    // A vehicle that cannot move (or has decelerated to a stop) will never progress
    if (speed === 0 && netForceN <= 0) {
      break
    }

    // Update state using Euler integration
    speed = Math.max(0, speed + acc * DT)
    distance += speed * DT
    time += DT
  }

  return { trace, performance }
}
