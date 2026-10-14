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

/** Holding the cruise speed steadily this long ends the run: the rest is steady state (s) */
const CRUISE_SETTLE_S = 1

/** Slowing below this fraction of the shift into the current gear downshifts (hysteresis) */
const DOWNSHIFT_FRACTION = 0.95

/** Slowing toward top speed by less than this counts as settled (m/s²) */
const SETTLED_DECEL_MS2 = 0.01

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
   * Stay in this gear whenever it can run at or above `minLoadRpm`. Below
   * that, lower gears shift normally and the held gear is taken as soon as it
   * becomes usable. In the held gear the rev limiter cuts drive force above
   * redline. Default: normal shifting through every gear.
   */
  holdGear?: number
  /**
   * Lowest rpm a held or cruising gear may run at (e.g. a lugging floor).
   * Default 0: the start of the torque curve.
   */
  minLoadRpm?: number
  /**
   * Hold this speed at part throttle once at or above it, in the highest gear
   * (or the held gear) that is above `minLoadRpm` and has the thrust to do so.
   * When no such gear can hold it, kick down to full throttle and run normally.
   * The run ends after holding it steadily for a moment. Default: full throttle.
   */
  cruiseSpeedMs?: number
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
    minLoadRpm = 0,
    cruiseSpeedMs,
  } = params

  const gradeAngle = Math.atan(gradePercent / 100)
  const rrN = rollingResistanceN(massKg, crr, gravityMs2) * Math.cos(gradeAngle)
  const gradeForceN = massKg * gravityMs2 * Math.sin(gradeAngle)

  const resistanceN = (v: number) => dragForceN(cd, frontalAreaM2, airDensityKgM3, v) + rrN + gradeForceN

  /** Speed where a gear reaches the minimum load rpm (rpm ∝ speed within a gear) */
  const gearMinSpeedMs = (gc: GearThrustCurve): number => {
    const start = gc.points[0]
    // Any point off zero gives the gear's speed-per-rpm (EV curves start at 0 rpm)
    const ref = gc.points.find((p) => p.rpm > 0)
    if (!start || !ref) return Infinity
    return (ref.speedMs / ref.rpm) * Math.max(minLoadRpm, start.rpm)
  }

  const holdCurve = holdGear !== undefined ? gearCurves.find((g) => g.gear === holdGear) : undefined
  const holdMinSpeedMs = holdCurve ? gearMinSpeedMs(holdCurve) : Infinity

  /**
   * Gear that can hold `v` at part throttle: the held gear when it's usable,
   * otherwise the highest usable gear (below any held gear) with enough thrust.
   */
  const cruiseGearAt = (v: number): number | null => {
    const candidates =
      holdCurve && v >= holdMinSpeedMs
        ? [holdCurve]
        : gearCurves.filter((g) => !holdCurve || g.gear < holdCurve.gear).sort((a, b) => b.gear - a.gear)
    const need = resistanceN(v)
    const fit = candidates.find(
      (gc) => v >= gearMinSpeedMs(gc) && v <= gc.speedRangeMs[1] && interpolateGearThrust(gc, v) >= need,
    )
    return fit ? fit.gear : null
  }

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

  // Enter the starting gear directly: the cruising gear when starting at the
  // cruise speed and able to hold it, else the held gear if usable, else normal
  let { gear, shiftIndex } = shiftedGearAt(speed)
  if (holdCurve && speed >= holdMinSpeedMs) gear = holdCurve.gear
  let cruising = false
  let cruiseSteadyS = 0
  // Acceleration on the last step with drive force (not mid-shift)
  let lastPoweredAccMs2 = 0
  // A gear just abandoned for losing speed; don't shift back into it until it can pull
  let weakGear: number | null = null
  if (cruiseSpeedMs !== undefined && speed >= cruiseSpeedMs) {
    const cg = cruiseGearAt(speed)
    if (cg !== null) {
      gear = cg
      cruising = true
    }
  }

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
    let partThrottle = false

    if (shiftTimeRemaining > 0) {
      // Gear change in progress — no thrust
      shiftTimeRemaining = Math.max(0, shiftTimeRemaining - DT)
    } else {
      const startShift = () => {
        shiftTimeRemaining = Math.max(0, shiftTimeMs / 1000 - DT)
      }

      if (cruiseSpeedMs !== undefined && (cruising || speed >= cruiseSpeedMs)) {
        const cg = cruiseGearAt(speed)
        if (cg !== null) {
          cruising = true
          if (cg !== gear) {
            gear = cg
            startShift()
          }
        } else if (cruising) {
          // Can't hold the speed in any usable gear: kick down to full throttle
          cruising = false
          const wot = shiftedGearAt(speed)
          const wotGear = holdCurve && speed >= holdMinSpeedMs ? holdCurve.gear : wot.gear
          shiftIndex = wot.shiftIndex
          if (wotGear !== gear) {
            gear = wotGear
            startShift()
          }
        }
      }

      if (cruising || shiftTimeRemaining > 0) {
        // Gear already settled for this step
      } else if (holdCurve && gear !== holdCurve.gear && speed >= holdMinSpeedMs) {
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
          const next = sortedShifts[shiftIndex].toGear
          if (next === weakGear) {
            const nextCurve = gearCurves.find((g) => g.gear === next)
            if (!nextCurve || interpolateGearThrust(nextCurve, speed) <= resistanceN(speed)) break
          }
          weakGear = null
          gear = next
          shiftIndex++
          startShift()
          break
        }
        // Losing speed under power (e.g. a grade it can't hold): downshift once well
        // below the shift into this gear. A dip while shifting doesn't count.
        if (
          shiftTimeRemaining <= 0 &&
          shiftIndex > 0 &&
          lastPoweredAccMs2 < 0 &&
          speed < sortedShifts[shiftIndex - 1].speedMs * DOWNSHIFT_FRACTION
        ) {
          const lower = shiftedGearAt(speed)
          weakGear = gear
          gear = lower.gear
          shiftIndex = lower.shiftIndex
          startShift()
        }
      }

      if (shiftTimeRemaining <= 0) {
        // Look up thrust from the current gear's curve; the rev limiter cuts it
        // above redline in a held gear
        const gc = gearCurves.find((g) => g.gear === gear)
        const revLimited = gc !== undefined && gc === holdCurve && speed > gc.speedRangeMs[1]
        thrustN = gc && !revLimited ? interpolateGearThrust(gc, speed) : 0
        if (cruising && cruiseSpeedMs !== undefined) {
          // Part throttle: just enough to hold (or regain) the cruise speed
          const needN = resistanceN(speed) + (massKg * Math.max(0, cruiseSpeedMs - speed)) / DT
          partThrottle = needN < thrustN
          thrustN = Math.min(thrustN, needN)
        }
      }
    }

    const dragN = dragForceN(cd, frontalAreaM2, airDensityKgM3, speed)
    const netForceN = thrustN - dragN - rrN - gradeForceN
    const acc = netForceN / massKg
    if (thrustN > 0) lastPoweredAccMs2 = acc

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

    // Holding the cruise speed steadily: nothing more will change
    cruiseSteadyS = partThrottle ? cruiseSteadyS + DT : 0
    if (cruiseSteadyS >= CRUISE_SETTLE_S) {
      break
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

    // Slowing toward top speed from above has a long asymptotic tail; stop once negligible
    if (
      topSpeedMs > 0 &&
      speed > topSpeedMs &&
      shiftTimeRemaining <= 0 &&
      acc < 0 &&
      acc > -SETTLED_DECEL_MS2
    ) {
      break
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
