import type { CarSpec } from '@/types/car'
import type { FuelType, TowScenario } from '@/types/truck'
import type { EnvelopePoint, GearThrustCurve, TimeStep } from '@/types/simulation'
import { DEFAULT_MODIFICATIONS } from '@/types/config'
import { DEFAULT_CRR, GRAVITY_MS2 } from '@/data/presets'
import { airDensityAtAltitude } from './altitude'
import { dragForceN } from './aerodynamics'
import { tireRadiusM } from './tires'
import { speedMsToRpm } from './drivetrain'
import { computeAllGearCurves, computeEnvelope, findShiftPoints, interpolateGearThrust } from './thrust'
import { runIntegration } from './performance'
import type { IntegrationParams } from './performance'
import { sampleTrace } from './playback'

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
  /** Integration inputs for the truck + trailer on the scenario grade, for time-domain runs */
  integration: IntegrationParams
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

/** A time-domain acceleration run with the trailer attached */
export interface TowingRun {
  trace: TimeStep[]
  /** Time the target speed was reached (s), or null if the rig tops out below it */
  finishTimeS: number | null
}

/**
 * Accelerate the rig from one speed to another on the scenario grade. The run
 * ends at the target speed, or where the rig stops gaining speed if it can't
 * reach it. `holdGear` keeps the transmission in that gear whenever it can run
 * above the lugging floor.
 */
export function towingRun(
  base: IntegrationParams,
  fromMs: number,
  toMs: number,
  holdGear?: number,
): TowingRun {
  const { trace } = runIntegration({ ...base, initialSpeedMs: fromMs, stopAtSpeedMs: toMs, holdGear })
  const last = trace[trace.length - 1]
  return { trace, finishTimeS: last && last.speedMs >= toMs ? last.timeS : null }
}

/** A hill climb: arrive at the grade at the target speed and try to hold it */
export interface HillClimbRun {
  trace: TimeStep[]
  /** Speed the rig settles at on the grade (m/s) */
  settledSpeedMs: number
  /** Gear it settles in */
  settledGear: number
  /** Held the target speed the whole way */
  holdsSpeed: boolean
}

/**
 * Hill climb on the scenario grade, starting at `speedMs`. The driver holds
 * that speed at part throttle in the highest gear above the lugging floor that
 * can (or the held gear); when none can, the transmission kicks down and the
 * rig slows at full throttle until it settles at its max sustainable speed.
 */
export function towingHillRun(base: IntegrationParams, speedMs: number, holdGear?: number): HillClimbRun {
  const { trace } = runIntegration({ ...base, initialSpeedMs: speedMs, cruiseSpeedMs: speedMs, holdGear })
  const last = trace[trace.length - 1]
  const settledSpeedMs = last?.speedMs ?? 0
  return {
    trace,
    settledSpeedMs,
    settledGear: last?.gear ?? 1,
    holdsSpeed: trace.every((s) => s.speedMs >= speedMs * 0.999),
  }
}

/** Tractor with a 53 ft trailer, bumper to tail (m) */
export const SEMI_LENGTH_M = 21.9
/** Following gap before pulling out, and the gap ahead of the semi before pulling back in (100 ft) */
export const PASS_GAP_M = 30.5
/** Time for one lane change (s) */
export const LANE_CHANGE_S = 2
/** Passes that would take longer than this are reported as not possible (s) */
const MAX_PASS_S = 90

/** Passing a semi with the trailer attached */
export interface PassRun {
  trace: TimeStep[]
  /** Relative distance the rig must gain on the semi to complete the pass (m) */
  gainNeededM: number
  /** When the rig is far enough ahead to start pulling back in (s), or null if it never is */
  clearTimeS: number | null
  /** Back in its lane: clear time plus the lane change (s) */
  passTimeS: number | null
  /** Distance covered from pulling out to being back in (m) */
  passDistanceM: number | null
  /** Clear road needed ahead: the pass distance plus what an oncoming car at the semi's speed covers meanwhile (m) */
  sightDistanceM: number | null
}

/**
 * Pass a semi doing `semiSpeedMs` on the scenario grade. The rig starts at the
 * semi's speed, PASS_GAP_M behind it, pulls out and accelerates at full
 * throttle up to `maxSpeedMs` (then holds it), and pulls back in once it is
 * PASS_GAP_M ahead of the semi's front. The semi holds its speed. Oncoming
 * traffic is assumed to match the semi.
 */
export function towingPass(
  base: IntegrationParams,
  semiSpeedMs: number,
  rigLengthM: number,
  options: { holdGear?: number; maxSpeedMs?: number } = {},
): PassRun {
  const { trace } = runIntegration({
    ...base,
    initialSpeedMs: semiSpeedMs,
    holdGear: options.holdGear,
    cruiseSpeedMs: options.maxSpeedMs,
  })
  const gainNeededM = PASS_GAP_M + SEMI_LENGTH_M + PASS_GAP_M + rigLengthM
  const gainAt = (i: number) => trace[i].distanceM - semiSpeedMs * trace[i].timeS

  let clearTimeS: number | null = null
  const i = trace.findIndex((_, k) => gainAt(k) >= gainNeededM)
  if (i > 0) {
    const f = (gainNeededM - gainAt(i - 1)) / (gainAt(i) - gainAt(i - 1))
    clearTimeS = trace[i - 1].timeS + f * (trace[i].timeS - trace[i - 1].timeS)
  } else if (i === -1 && trace.length > 0) {
    // Past the end of the trace the rig holds its last speed
    const last = trace[trace.length - 1]
    const closingMs = last.speedMs - semiSpeedMs
    if (closingMs > 0.01) clearTimeS = last.timeS + (gainNeededM - gainAt(trace.length - 1)) / closingMs
  }
  if (clearTimeS === null || clearTimeS + LANE_CHANGE_S > MAX_PASS_S) {
    return { trace, gainNeededM, clearTimeS: null, passTimeS: null, passDistanceM: null, sightDistanceM: null }
  }

  const passTimeS = clearTimeS + LANE_CHANGE_S
  const passDistanceM = sampleTrace(trace, passTimeS).distanceM
  return {
    trace,
    gainNeededM,
    clearTimeS,
    passTimeS,
    passDistanceM,
    sightDistanceM: passDistanceM + semiSpeedMs * passTimeS,
  }
}

function passingTimeS(base: IntegrationParams, fromMph: number, toMph: number): number | null {
  return towingRun(base, fromMph * MPH_TO_MS, toMph * MPH_TO_MS).finishTimeS
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
    // Lugging floor for held and cruising gears
    minLoadRpm,
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
    integration: integrationBase,
  }
}

/**
 * Speed (m/s) beyond which no truck in a comparison can accelerate: the highest
 * max-sustainable speed across the entries, plus a small margin so the last
 * thrust/load crossing is visible, never past the widest envelope. Trucks that
 * cannot hold any speed on the scenario contribute nothing; if none can, the
 * widest envelope is used so the chart still shows why.
 */
export function chartSpeedCutoffMs(
  analyses: Pick<TowingAnalysis, 'maxSustainable' | 'envelope'>[],
  marginFraction = 0.03,
): number {
  const envelopeMax = Math.max(0, ...analyses.map((a) => a.envelope.at(-1)?.speedMs ?? 0))
  const sustainableMax = Math.max(0, ...analyses.map((a) => a.maxSustainable?.speedMs ?? 0))
  if (sustainableMax <= 0) return envelopeMax
  return Math.min(envelopeMax, sustainableMax * (1 + marginFraction))
}
