import type { CarSpec } from '@/types/car'
import type { FuelType, TowScenario } from '@/types/truck'
import type { EnvelopePoint, GearThrustCurve } from '@/types/simulation'
import { DEFAULT_MODIFICATIONS } from '@/types/config'
import { DEFAULT_CRR, GRAVITY_MS2 } from '@/data/presets'
import { airDensityAtAltitude } from './altitude'
import { dragForceN } from './aerodynamics'
import { tireRadiusM } from './tires'
import { speedMsToRpm } from './drivetrain'
import { computeAllGearCurves, computeEnvelope, findShiftPoints, interpolateGearThrust } from './thrust'
import { runIntegration } from './performance'
import type { IntegrationParams } from './performance'

/**
 * Minimum engine RPM for sustained pulling with a locked torque converter.
 * Below this the transmission would downshift rather than lug the engine.
 */
export const MIN_LOAD_RPM_DIESEL = 1000
export const MIN_LOAD_RPM_GAS = 1250
/** Electric motors deliver full torque from a standstill — no lugging floor */
export const MIN_LOAD_RPM_EV = 0

/** Speed sample interval for the road-load overlay curve (m/s) */
const ROAD_LOAD_STEP_MS = 0.5

const MPH_TO_MS = 0.44704

/** Masses and rolling-resistance coefficients of the truck/trailer combination */
export interface TowingMasses {
  /** Truck curb weight plus cargo/payload */
  truckMassKg: number
  trailerMassKg: number
  truckCrr: number
  trailerCrr: number
}

/** One gear's situation at the analyzed speed */
export interface GearAtSpeed {
  gear: number
  rpm: number
  /** RPM sits within [lugging floor, redline] */
  usable: boolean
  /** Wheel thrust available at this speed in this gear (N) */
  thrustN: number
  /** thrustN − road load; negative = cannot hold speed (N) */
  surplusN: number
  /** Wheel power available at this speed in this gear (kW) */
  availableKw: number
  /** Surplus (deficit when negative) power at this speed (kW) */
  surplusKw: number
}

export interface GearMaxGrade {
  gear: number
  rpm: number
  /** Steepest grade (%) this gear can hold at the analyzed speed */
  maxGradePercent: number
}

export interface TowingAnalysis {
  gearCurves: GearThrustCurve[]
  envelope: EnvelopePoint[]
  airDensityKgM3: number
  /** Truck CdA plus the trailer's effective CdA (m²) */
  combinedCdA: number
  totalMassKg: number
  /** Force needed to hold the scenario speed on the scenario grade (N) */
  roadLoadN: number
  /** Power needed to hold the scenario speed (kW, at the wheels) */
  requiredKw: number
  /** Lugging floor used for gear usability (rpm, fuel-type dependent) */
  minLoadRpm: number
  gearsAtSpeed: GearAtSpeed[]
  /** Highest (lowest-RPM) gear that can hold the scenario speed, or null if none */
  cruisingGear: GearAtSpeed | null
  /** Fastest steady speed on the scenario grade, or null if none */
  maxSustainable: { speedMs: number; gear: number; rpm: number } | null
  /** Steepest holdable grade at the scenario speed, per usable gear */
  maxGradePerGear: GearMaxGrade[]
  /** Steepest holdable grade at the scenario speed across all usable gears */
  absoluteMaxGrade: { gradePercent: number; gear: number } | null
  /** Passing times with the trailer attached (s), null when the target speed is unreachable */
  passing: { from40to60S: number | null; from50to70S: number | null }
  /** Road-load force vs speed for chart overlay (scenario grade and altitude) */
  roadLoadCurve: { speedMs: number; forceN: number }[]
}

/**
 * Total force required to hold a steady speed while towing:
 *   ½·ρ·CdA·v²  +  (m_truck·Crr_truck + m_trailer·Crr_trailer)·g·cosθ  +  (m_truck + m_trailer)·g·sinθ
 * where θ = atan(grade% / 100).
 */
export function towingRoadLoadN(
  masses: TowingMasses,
  combinedCdA: number,
  airDensityKgM3: number,
  gradePercent: number,
  speedMs: number,
  gravityMs2: number = GRAVITY_MS2,
): number {
  const theta = Math.atan(gradePercent / 100)
  const aeroN = dragForceN(combinedCdA, 1, airDensityKgM3, speedMs)
  const rrN =
    (masses.truckMassKg * masses.truckCrr + masses.trailerMassKg * masses.trailerCrr) *
    gravityMs2 *
    Math.cos(theta)
  const gradeN = (masses.truckMassKg + masses.trailerMassKg) * gravityMs2 * Math.sin(theta)
  return aeroN + rrN + gradeN
}

/**
 * Steepest grade (%) that a given available thrust can hold at a given speed.
 * Solves  thrust − F_aero = B·cosθ + C·sinθ  for θ, where B is the flat-ground
 * rolling-resistance force and C the total weight force. Negative results mean
 * the thrust cannot even hold speed on flat ground (a downhill would be needed).
 */
export function maxGradePercentAtSpeed(
  availableThrustN: number,
  masses: TowingMasses,
  combinedCdA: number,
  airDensityKgM3: number,
  speedMs: number,
  gravityMs2: number = GRAVITY_MS2,
): number {
  const a = availableThrustN - dragForceN(combinedCdA, 1, airDensityKgM3, speedMs)
  const b =
    (masses.truckMassKg * masses.truckCrr + masses.trailerMassKg * masses.trailerCrr) * gravityMs2
  const c = (masses.truckMassKg + masses.trailerMassKg) * gravityMs2
  // B·cosθ + C·sinθ = R·sin(θ + φ), R = √(B²+C²), φ = atan2(B, C)
  const r = Math.hypot(b, c)
  const ratio = Math.min(1, Math.max(-1, a / r))
  const theta = Math.asin(ratio) - Math.atan2(b, c)
  return Math.tan(theta) * 100
}

/**
 * Fastest steady speed the thrust envelope can sustain against the towing road
 * load on a given grade. Scans the envelope from the top and linearly refines
 * the crossing. Returns null when the load exceeds thrust at every speed.
 */
export function maxSustainableSpeed(
  envelope: EnvelopePoint[],
  masses: TowingMasses,
  combinedCdA: number,
  airDensityKgM3: number,
  gradePercent: number,
  gravityMs2: number = GRAVITY_MS2,
): { speedMs: number; gear: number } | null {
  const surplusAt = (pt: EnvelopePoint): number =>
    pt.forceN -
    towingRoadLoadN(masses, combinedCdA, airDensityKgM3, gradePercent, pt.speedMs, gravityMs2)

  for (let i = envelope.length - 1; i >= 0; i--) {
    const surplus = surplusAt(envelope[i])
    if (surplus < 0) continue

    // Envelope can hold speed here; refine against the next (unsustainable) point
    if (i === envelope.length - 1) {
      return { speedMs: envelope[i].speedMs, gear: envelope[i].gear }
    }
    const next = envelope[i + 1]
    const nextSurplus = surplusAt(next)
    const t = surplus / (surplus - nextSurplus)
    return {
      speedMs: envelope[i].speedMs + t * (next.speedMs - envelope[i].speedMs),
      gear: envelope[i].gear,
    }
  }

  return null
}

/**
 * Evaluate every gear at a fixed speed: RPM, usability, and thrust surplus
 * against the road load.
 */
export function analyzeGearsAtSpeed(
  gearCurves: GearThrustCurve[],
  gearEffectiveRatios: number[],
  radiusM: number,
  speedMs: number,
  roadLoadN: number,
  minLoadRpm: number,
  redlineRpm: number,
): GearAtSpeed[] {
  return gearCurves.map((gc) => {
    const effRatio = gearEffectiveRatios[gc.gear - 1]
    const rpm = speedMsToRpm(speedMs, effRatio, 1, radiusM)
    const thrustN = interpolateGearThrust(gc, speedMs)
    const surplusN = thrustN - roadLoadN
    return {
      gear: gc.gear,
      rpm,
      usable: rpm >= minLoadRpm && rpm <= redlineRpm,
      thrustN,
      surplusN,
      availableKw: (thrustN * speedMs) / 1000,
      surplusKw: (surplusN * speedMs) / 1000,
    }
  })
}

function passingTimeS(base: IntegrationParams, fromMph: number, toMph: number): number | null {
  const fromMs = fromMph * MPH_TO_MS
  const toMs = toMph * MPH_TO_MS
  const { trace } = runIntegration({ ...base, initialSpeedMs: fromMs, stopAtSpeedMs: toMs })
  const last = trace[trace.length - 1]
  if (!last || last.speedMs < toMs) return null
  return last.timeS
}

/**
 * Full towing analysis for one truck (already resolved to a CarSpec) in a
 * shared scenario. Altitude correction, gearing, and drivetrain loss all come
 * from the existing simulation engine; this layer adds trailer load and grade.
 */
export function runTowingAnalysis(
  car: CarSpec,
  scenario: TowScenario,
  fuel: FuelType,
): TowingAnalysis {
  const mods = { ...DEFAULT_MODIFICATIONS, altitudeM: scenario.altitudeM }
  const airDensityKgM3 = airDensityAtAltitude(scenario.altitudeM)

  const gearCurves = computeAllGearCurves(car, mods)
  const envelope = computeEnvelope(gearCurves)
  const shiftPoints = findShiftPoints(car, mods, gearCurves, envelope)

  const masses: TowingMasses = {
    truckMassKg: car.curbWeightKg + scenario.cargoMassKg,
    trailerMassKg: scenario.trailer.massKg,
    truckCrr: DEFAULT_CRR,
    trailerCrr: scenario.trailer.crr,
  }
  const totalMassKg = masses.truckMassKg + masses.trailerMassKg
  const combinedCdA = car.aero.cd * car.aero.frontalAreaM2 + scenario.trailer.effectiveCdA

  const roadLoadN = towingRoadLoadN(
    masses,
    combinedCdA,
    airDensityKgM3,
    scenario.gradePercent,
    scenario.speedMs,
  )

  const radiusM = tireRadiusM(car.tireSize)
  const gearEffectiveRatios = car.transmission.gearRatios.map(
    (r) => r * car.transmission.finalDriveRatio,
  )
  const minLoadRpm =
    fuel === 'diesel' ? MIN_LOAD_RPM_DIESEL : fuel === 'ev' ? MIN_LOAD_RPM_EV : MIN_LOAD_RPM_GAS

  const gearsAtSpeed = analyzeGearsAtSpeed(
    gearCurves,
    gearEffectiveRatios,
    radiusM,
    scenario.speedMs,
    roadLoadN,
    minLoadRpm,
    car.engine.redlineRpm,
  )

  // The user-facing "best" gear: highest gear (lowest RPM) that can hold speed
  const cruisingGear =
    gearsAtSpeed.filter((g) => g.usable && g.surplusN >= 0).at(-1) ?? null

  const sustainable = maxSustainableSpeed(
    envelope,
    masses,
    combinedCdA,
    airDensityKgM3,
    scenario.gradePercent,
  )
  const maxSustainable = sustainable
    ? {
        ...sustainable,
        rpm: speedMsToRpm(sustainable.speedMs, gearEffectiveRatios[sustainable.gear - 1], 1, radiusM),
      }
    : null

  const maxGradePerGear: GearMaxGrade[] = gearsAtSpeed
    .filter((g) => g.usable)
    .map((g) => ({
      gear: g.gear,
      rpm: g.rpm,
      maxGradePercent: maxGradePercentAtSpeed(
        g.thrustN,
        masses,
        combinedCdA,
        airDensityKgM3,
        scenario.speedMs,
      ),
    }))
  const absoluteMaxGrade = maxGradePerGear.reduce<{ gradePercent: number; gear: number } | null>(
    (best, g) =>
      best === null || g.maxGradePercent > best.gradePercent
        ? { gradePercent: g.maxGradePercent, gear: g.gear }
        : best,
    null,
  )

  // Passing runs: combined mass and drag, mass-weighted rolling resistance
  const effectiveCrr =
    (masses.truckMassKg * masses.truckCrr + masses.trailerMassKg * masses.trailerCrr) / totalMassKg
  const integrationBase: IntegrationParams = {
    envelope,
    gearCurves,
    shiftPoints,
    massKg: totalMassKg,
    shiftTimeMs: car.transmission.shiftTimeMs,
    crr: effectiveCrr,
    airDensityKgM3,
    cd: combinedCdA,
    frontalAreaM2: 1,
    gravityMs2: GRAVITY_MS2,
    gearEffectiveRatios,
    tireRadiusM: radiusM,
    gradePercent: scenario.gradePercent,
  }
  const passing = {
    from40to60S: passingTimeS(integrationBase, 40, 60),
    from50to70S: passingTimeS(integrationBase, 50, 70),
  }

  const maxEnvelopeSpeed = envelope.length > 0 ? envelope[envelope.length - 1].speedMs : 0
  const roadLoadCurve: { speedMs: number; forceN: number }[] = []
  for (let v = 0; v <= maxEnvelopeSpeed + ROAD_LOAD_STEP_MS / 2; v += ROAD_LOAD_STEP_MS) {
    roadLoadCurve.push({
      speedMs: v,
      forceN: towingRoadLoadN(masses, combinedCdA, airDensityKgM3, scenario.gradePercent, v),
    })
  }

  return {
    gearCurves,
    envelope,
    airDensityKgM3,
    combinedCdA,
    totalMassKg,
    roadLoadN,
    requiredKw: (roadLoadN * scenario.speedMs) / 1000,
    minLoadRpm,
    gearsAtSpeed,
    cruisingGear,
    maxSustainable,
    maxGradePerGear,
    absoluteMaxGrade,
    passing,
    roadLoadCurve,
  }
}
