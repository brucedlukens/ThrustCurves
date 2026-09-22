import type { CarSpec } from '@/types/car'
import type { CarModifications } from '@/types/config'
import type { EnvelopePoint, GearThrustCurve } from '@/types/simulation'
import type {
  GripEnvelope,
  LimitKind,
  RunSegment,
  TelemetryRun,
  WhatIfOptions,
  WhatIfResult,
  WhatIfSegmentResult,
} from '@/types/telemetry'
import { DEFAULT_CRR, GRAVITY_MS2 } from '@/data/presets'
import { airDensityAtAltitude } from '../altitude'
import { dragForceN } from '../aerodynamics'
import { rollingResistanceN, tireRadiusM } from '../tires'
import { computeAllGearCurves, computeEnvelope, interpolateEnvelope, interpolateGearThrust } from '../thrust'
import { G, longitudinalAvailableG } from './envelope'
import { impliedTractiveForceN } from './roadDyno'

/** Everything the integrator needs to know about one powertrain configuration. */
export interface PowertrainModel {
  massKg: number
  cd: number
  frontalAreaM2: number
  airDensityKgM3: number
  crr: number
  envelope: EnvelopePoint[]
  gearCurves: GearThrustCurve[]
  /** gearRatio × finalDrive per gear, index 0 = 1st */
  gearEffectiveRatios: number[]
  tireRadiusM: number
}

/** Build a PowertrainModel from a CarSpec + modifications using the existing thrust engine. */
export function buildPowertrainModel(car: CarSpec, mods: CarModifications, crr = DEFAULT_CRR): PowertrainModel {
  const gearCurves = computeAllGearCurves(car, mods)
  const envelope = computeEnvelope(gearCurves)
  const finalDrive = mods.finalDriveOverride ?? car.transmission.finalDriveRatio
  return {
    massKg: car.curbWeightKg + mods.weightDeltaKg,
    cd: mods.cdOverride ?? car.aero.cd,
    frontalAreaM2: mods.frontalAreaOverride ?? car.aero.frontalAreaM2,
    airDensityKgM3: airDensityAtAltitude(mods.altitudeM),
    crr,
    envelope,
    gearCurves,
    gearEffectiveRatios: car.transmission.gearRatios.map((r, i) => (mods.gearRatioOverrides[i] ?? r) * finalDrive),
    tireRadiusM: tireRadiusM(mods.tireSizeOverride ?? car.tireSize),
  }
}

/** Thrust (N) at a speed: the envelope, or a held gear (0 above that gear's redline speed). */
export function thrustAtSpeed(model: PowertrainModel, speedMs: number, heldGear?: number, limiterRpm?: number): number {
  if (heldGear !== undefined) {
    const gc = model.gearCurves[heldGear - 1]
    if (!gc || gc.points.length === 0) return 0
    if (speedMs > gc.speedRangeMs[1]) return 0
    if (limiterRpm !== undefined) {
      const ratio = model.gearEffectiveRatios[heldGear - 1]
      const rpm = (speedMs * ratio * 60) / (2 * Math.PI * model.tireRadiusM)
      if (rpm > limiterRpm) return 0
    }
    return interpolateGearThrust(gc, speedMs)
  }
  return interpolateEnvelope(model.envelope, speedMs)
}

/**
 * Detect which gear the logged rpm/speed pair implies, for the given model.
 * Returns undefined when speed is too low or no gear matches within tolerance.
 */
export function detectGear(model: PowertrainModel, speedMs: number, rpm: number, tolerance = 0.12): number | undefined {
  if (speedMs < 3 || !Number.isFinite(rpm) || rpm <= 0) return undefined
  const k = rpm / speedMs
  let best: number | undefined
  let bestErr = Infinity
  model.gearEffectiveRatios.forEach((ratio, i) => {
    const expected = (ratio * 60) / (2 * Math.PI * model.tireRadiusM)
    const err = Math.abs(k - expected) / expected
    if (err < bestErr) {
      bestErr = err
      best = i + 1
    }
  })
  return bestErr <= tolerance ? best : undefined
}

/** Most common detected gear inside a segment, or undefined when nothing was detected. */
export function segmentGear(model: PowertrainModel, run: TelemetryRun, seg: RunSegment): number | undefined {
  const counts = new Map<number, number>()
  for (let i = seg.startIdx; i < seg.endIdx; i++) {
    const s = run.samples[i]
    if (s.rpm === undefined) continue
    const g = detectGear(model, s.speedMs, s.rpm)
    if (g !== undefined) counts.set(g, (counts.get(g) ?? 0) + 1)
  }
  let best: number | undefined
  let bestN = 0
  for (const [g, n] of counts) {
    if (n > bestN) {
      bestN = n
      best = g
    }
  }
  return best
}

/** Fraction of the observed rev-limit rpm above which a sample counts as "on the limiter". */
const LIMITER_FRACTION = 0.97

/**
 * The rev limiter the car actually hit in this run: the 99.5th percentile of rpm.
 * Undefined when the log has no rpm channel.
 */
export function observedLimiterRpm(run: TelemetryRun): number | undefined {
  if (!run.hasRpm) return undefined
  const rpms = run.samples.map(s => s.rpm ?? NaN).filter(r => Number.isFinite(r) && r > 0)
  if (rpms.length < 10) return undefined
  rpms.sort((a, b) => a - b)
  return rpms[Math.min(rpms.length - 1, Math.floor(rpms.length * 0.995))]
}

/**
 * Scalar that makes the modeled thrust match the log's implied tractive force
 * over the power-limited samples (median ratio, clamped to [0.5, 1.5]).
 *
 * Compares like with like: in hold-gear mode the modeled thrust comes from the
 * gear the log says the car was in, and samples sitting on the rev limiter are
 * skipped, since their near-zero acceleration says nothing about the engine.
 */
export function computeCalibrationFactor(
  run: TelemetryRun,
  kinds: LimitKind[],
  model: PowertrainModel,
  gearStrategy: WhatIfOptions['gearStrategy'] = 'optimal',
): number {
  const ratios: number[] = []
  const p = { ...model, gravityMs2: GRAVITY_MS2 }
  const hold = gearStrategy === 'hold' && run.hasRpm
  const limiter = observedLimiterRpm(run)
  run.samples.forEach((s, i) => {
    if (kinds[i] !== 'power' || s.speedMs < 3) return
    if (limiter !== undefined && s.rpm !== undefined && s.rpm >= LIMITER_FRACTION * limiter) return
    let heldGear: number | undefined
    if (hold) {
      heldGear = detectGear(model, s.speedMs, s.rpm ?? NaN)
      if (heldGear === undefined) return
    }
    const modeled = thrustAtSpeed(model, s.speedMs, heldGear)
    if (modeled <= 0) return
    const measured = impliedTractiveForceN(s, p)
    if (measured <= 0) return
    ratios.push(measured / modeled)
  })
  if (ratios.length < 5) return 1
  ratios.sort((a, b) => a - b)
  const mid = Math.floor(ratios.length / 2)
  const med = ratios.length % 2 ? ratios[mid] : (ratios[mid - 1] + ratios[mid]) / 2
  return Math.min(1.5, Math.max(0.5, med))
}

/** Elapsed time over a speed-vs-distance trace on a uniform grid. */
export function traceTimeS(speeds: number[], stepM: number, from = 0, to = speeds.length): number {
  let t = 0
  for (let i = Math.max(1, from + 1); i < to; i++) {
    const vAvg = Math.max(0.5, (speeds[i - 1] + speeds[i]) / 2)
    t += stepM / vAvg
  }
  return t
}

type CeilingSource = 'fixed' | 'lateral' | 'braking'

/**
 * Speed ceiling per sample:
 * - non-power, non-braking samples are fixed at the measured speed
 * - power samples are capped by lateral grip on the driven line
 * - braking samples (and power samples ahead of them) are capped by a max-braking
 *   curve integrated backwards from the next fixed sample
 */
export function computeCeiling(
  run: TelemetryRun,
  kinds: LimitKind[],
  env: GripEnvelope,
): { ceiling: number[]; source: CeilingSource[]; lateralCeiling: number[] } {
  const n = run.samples.length
  const ceiling = new Array<number>(n)
  const source = new Array<CeilingSource>(n)
  const lateralCeiling = new Array<number>(n).fill(Infinity)
  for (let i = 0; i < n; i++) {
    const s = run.samples[i]
    if (kinds[i] === 'power' || kinds[i] === 'braking') {
      const latG = s.latAccelMs2 / G
      if (latG > 0.02 && s.speedMs > 0) {
        // Never below the measured speed: the car demonstrably went this fast on this line
        lateralCeiling[i] = Math.max(s.speedMs, s.speedMs * Math.sqrt(env.maxLatG / latG))
      }
      ceiling[i] = lateralCeiling[i]
      source[i] = 'lateral'
    } else {
      ceiling[i] = s.speedMs
      source[i] = 'fixed'
    }
  }
  for (let i = n - 2; i >= 0; i--) {
    if (source[i] === 'fixed') continue
    const latUse = run.samples[i].latAccelMs2 / G / env.maxLatG
    const brakeMs2 = longitudinalAvailableG(env.maxBrakeG, latUse) * G
    const fromNext = Math.sqrt(ceiling[i + 1] * ceiling[i + 1] + 2 * brakeMs2 * run.stepM)
    if (fromNext < ceiling[i]) {
      ceiling[i] = Math.max(fromNext, run.samples[i].speedMs)
      source[i] = 'braking'
    }
  }
  return { ceiling, source, lateralCeiling }
}

interface TraceFlags {
  gripLimitedAtM?: number
  brakingLimitedAtM?: number
  revLimitedAtM?: number
}

/**
 * Re-integrate the power-limited segments with a powertrain model, holding
 * everything else at the measured speed (with late-braking credit through
 * braking zones that follow a faster exit).
 */
export function simulateTrace(
  run: TelemetryRun,
  kinds: LimitKind[],
  segments: RunSegment[],
  env: GripEnvelope,
  model: PowertrainModel,
  calibration: number,
  gearStrategy: WhatIfOptions['gearStrategy'],
  ceiling: number[],
  ceilingSource: CeilingSource[],
  limiterRpm?: number,
): { speeds: number[]; flags: Map<number, TraceFlags> } {
  const n = run.samples.length
  const dx = run.stepM
  const v = run.samples.map(s => s.speedMs)
  const flags = new Map<number, TraceFlags>()
  const rrN = rollingResistanceN(model.massKg, model.crr, GRAVITY_MS2)

  for (const seg of segments) {
    if (seg.kind !== 'power') continue
    const f: TraceFlags = {}
    const heldGear = gearStrategy === 'hold' && run.hasRpm ? segmentGear(model, run, seg) : undefined

    for (let i = seg.startIdx; i < seg.endIdx - 1 && i < n - 1; i++) {
      const s = run.samples[i]
      const thrust = calibration * thrustAtSpeed(model, v[i], heldGear, heldGear !== undefined ? limiterRpm : undefined)
      if (heldGear !== undefined && thrust === 0 && f.revLimitedAtM === undefined && v[i] > 3) {
        f.revLimitedAtM = s.distanceM
      }
      const drag = dragForceN(model.cd, model.frontalAreaM2, model.airDensityKgM3, v[i])
      const aPower = (thrust - drag - rrN) / model.massKg

      // Same line ⇒ same radius: lateral g scales with speed²
      const latGMeas = s.latAccelMs2 / G
      const latGNew = s.speedMs > 0.5 ? latGMeas * (v[i] / s.speedMs) ** 2 : latGMeas
      const aGrip = longitudinalAvailableG(env.maxAccelG, latGNew / env.maxLatG) * G

      let a = aPower
      if (aGrip < aPower) {
        a = aGrip
        if (f.gripLimitedAtM === undefined) f.gripLimitedAtM = s.distanceM
      }
      let vNext = Math.sqrt(Math.max(0, v[i] * v[i] + 2 * a * dx))
      if (vNext > ceiling[i + 1]) {
        vNext = ceiling[i + 1]
        if (ceilingSource[i + 1] === 'braking' && f.brakingLimitedAtM === undefined) {
          f.brakingLimitedAtM = run.samples[i + 1].distanceM
        } else if (ceilingSource[i + 1] === 'lateral' && f.gripLimitedAtM === undefined) {
          f.gripLimitedAtM = run.samples[i + 1].distanceM
        }
      }
      v[i + 1] = vNext
    }

    // Carry a faster exit through the following braking zone: hold speed, then
    // follow the max-braking ceiling down to the next fixed sample.
    for (let j = seg.endIdx; j < n && kinds[j] === 'braking'; j++) {
      const carried = Math.min(v[j - 1], ceiling[j])
      if (carried <= run.samples[j].speedMs) break
      v[j] = carried
    }
    flags.set(seg.index, f)
  }
  return { speeds: v, flags }
}

export interface WhatIfInput {
  run: TelemetryRun
  kinds: LimitKind[]
  segments: RunSegment[]
  envelope: GripEnvelope
  baseline: PowertrainModel
  modified: PowertrainModel
  options: WhatIfOptions
}

/** Run the full what-if: baseline sim, modified sim, per-segment deltas. */
export function runWhatIf(input: WhatIfInput): WhatIfResult {
  const { run, kinds, segments, options } = input
  const stepM = run.stepM
  const n = run.samples.length

  let envelope = input.envelope
  if (options.scaleGripWithMass && input.baseline.massKg > 0) {
    // Lighter car, same tires: assume the same lateral/longitudinal g (grip scales with load).
    // Heavier car: g drops with the added mass. Keep it symmetric and simple.
    const ratio = input.baseline.massKg / input.modified.massKg
    const scale = ratio < 1 ? ratio : 1
    envelope = {
      maxLatG: input.envelope.maxLatG * scale,
      maxAccelG: input.envelope.maxAccelG * scale,
      maxBrakeG: input.envelope.maxBrakeG * scale,
    }
  }

  const calibrationFactor = options.calibrate
    ? computeCalibrationFactor(run, kinds, input.baseline, options.gearStrategy)
    : 1
  const { ceiling, source, lateralCeiling } = computeCeiling(run, kinds, envelope)
  // In hold-gear mode the limiter the car actually hit beats the curve's last rpm
  const limiterRpm = options.gearStrategy === 'hold' ? observedLimiterRpm(run) : undefined

  const base = simulateTrace(run, kinds, segments, envelope, input.baseline, calibrationFactor, options.gearStrategy, ceiling, source, limiterRpm)
  const mod = simulateTrace(run, kinds, segments, envelope, input.modified, calibrationFactor, options.gearStrategy, ceiling, source, limiterRpm)

  const measured = run.samples.map(s => s.speedMs)
  const powerSegs = segments.filter(s => s.kind === 'power')

  const segmentResults: WhatIfSegmentResult[] = powerSegs.map((seg, k) => {
    // Window runs to the start of the next power segment so late-braking credit is attributed here
    const windowEnd = powerSegs[k + 1]?.startIdx ?? n
    const baselineTimeS = traceTimeS(base.speeds, stepM, seg.startIdx, windowEnd)
    const modifiedTimeS = traceTimeS(mod.speeds, stepM, seg.startIdx, windowEnd)
    const bSlice = base.speeds.slice(seg.startIdx, seg.endIdx)
    const mSlice = mod.speeds.slice(seg.startIdx, seg.endIdx)
    // Line headroom: the sample where lateral grip binds soonest relative to the speed driven
    let headroom = Infinity
    let headroomRatio = Infinity
    for (let i = seg.startIdx; i < seg.endIdx; i++) {
      const v = run.samples[i].speedMs
      if (v <= 0.5 || !Number.isFinite(lateralCeiling[i])) continue
      const ratio = lateralCeiling[i] / v
      if (ratio < headroomRatio) {
        headroomRatio = ratio
        headroom = lateralCeiling[i]
      }
    }
    const f = mod.flags.get(seg.index) ?? {}
    return {
      segment: seg,
      baselineTimeS,
      modifiedTimeS,
      deltaS: modifiedTimeS - baselineTimeS,
      baselinePeakMs: Math.max(...bSlice),
      modifiedPeakMs: Math.max(...mSlice),
      baselineExitMs: bSlice[bSlice.length - 1],
      modifiedExitMs: mSlice[mSlice.length - 1],
      gripLimitedAtM: f.gripLimitedAtM,
      brakingLimitedAtM: f.brakingLimitedAtM,
      revLimitedAtM: f.revLimitedAtM,
      lineHeadroomCeilingMs: headroom,
      lineHeadroomRatio: headroomRatio,
    }
  })

  const totalBaselineTimeS = traceTimeS(base.speeds, stepM)
  const totalModifiedTimeS = traceTimeS(mod.speeds, stepM)

  let sq = 0
  let cnt = 0
  kinds.forEach((k, i) => {
    if (k !== 'power') return
    sq += (base.speeds[i] - measured[i]) ** 2
    cnt++
  })

  return {
    measuredSpeedsMs: measured,
    baselineSpeedsMs: base.speeds,
    modifiedSpeedsMs: mod.speeds,
    kinds,
    segments,
    segmentResults,
    totalBaselineTimeS,
    totalModifiedTimeS,
    totalDeltaS: totalModifiedTimeS - totalBaselineTimeS,
    powerLimitedFraction: n > 0 ? cnt / n : 0,
    calibrationFactor,
    baselineFitRmsMs: cnt > 0 ? Math.sqrt(sq / cnt) : 0,
    envelope,
  }
}
