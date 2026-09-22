import { describe, it, expect } from 'vitest'
import { analyzeWhatIf, parseCsv, autoDetectMapping, buildRun, inferRoadDyno } from './index'
import {
  runWhatIf,
  buildPowertrainModel,
  thrustAtSpeed,
  detectGear,
  traceTimeS,
  computeCeiling,
  computeCalibrationFactor,
  observedLimiterRpm,
  loggedGears,
  observedShiftRpm,
  rpmAt,
} from './whatif'
import { markLaunch } from './classify'
import { DEFAULT_MODIFICATIONS } from '@/types/config'
import { DEFAULT_WHATIF_OPTIONS } from '@/types/telemetry'
import type { LimitKind, TelemetryRun, TelemetrySample } from '@/types/telemetry'
import { getTestCar, rowsToCsv, synthesizeRun, SAMPLE_COURSE } from '@/test/telemetryFixtures'
import { GRAVITY_MS2 } from '@/data/presets'

const car = getTestCar()

function makeRun(opts: Parameters<typeof synthesizeRun>[2] = {}, csvOpts = opts): TelemetryRun {
  const rows = synthesizeRun(car, SAMPLE_COURSE, { rateHz: 10, ...opts })
  const table = parseCsv(rowsToCsv(rows, csvOpts))
  return buildRun(table, autoDetectMapping(table.headers))
}

describe('buildPowertrainModel / thrustAtSpeed / detectGear', () => {
  const model = buildPowertrainModel(car, DEFAULT_MODIFICATIONS)

  it('builds a model with envelope, gear curves and effective ratios', () => {
    expect(model.massKg).toBe(car.curbWeightKg + 91) // driver always on board
    expect(model.envelope.length).toBeGreaterThan(10)
    expect(model.gearCurves).toHaveLength(car.transmission.gearRatios.length)
    expect(model.gearEffectiveRatios[0]).toBeCloseTo(car.transmission.gearRatios[0] * car.transmission.finalDriveRatio, 6)
  })

  it('applies weight, final drive and torque mods', () => {
    const m = buildPowertrainModel(car, { ...DEFAULT_MODIFICATIONS, weightDeltaKg: 100, finalDriveOverride: 4.5, torqueMultiplier: 1.2 })
    expect(m.massKg).toBe(car.curbWeightKg + 91 + 100)
    expect(m.gearEffectiveRatios[1]).toBeCloseTo(car.transmission.gearRatios[1] * 4.5, 6)
    expect(thrustAtSpeed(m, 20)).toBeGreaterThan(thrustAtSpeed(model, 20))
  })

  it('held gear returns zero thrust past that gear’s redline speed', () => {
    const secondMax = model.gearCurves[1].speedRangeMs[1]
    expect(thrustAtSpeed(model, secondMax - 1, 2)).toBeGreaterThan(0)
    expect(thrustAtSpeed(model, secondMax + 1, 2)).toBe(0)
    expect(thrustAtSpeed(model, 10, 99)).toBe(0)
  })

  it('detects the gear from rpm/speed and rejects nonsense', () => {
    const ratio = model.gearEffectiveRatios[1]
    const rpmAt20 = (20 * ratio * 60) / (2 * Math.PI * model.tireRadiusM)
    expect(detectGear(model, 20, rpmAt20)).toBe(2)
    expect(detectGear(model, 20, rpmAt20 * 1.25)).toBeUndefined()
    expect(detectGear(model, 1, 3000)).toBeUndefined()
  })
})

const stockModel = buildPowertrainModel(car, DEFAULT_MODIFICATIONS)
const rpmIn = (gear: number, v: number) => (v * stockModel.gearEffectiveRatios[gear - 1] * 60) / (2 * Math.PI * stockModel.tireRadiusM)

/** A run of full-throttle samples in 2nd gear from `v0` m/s, `n` samples, where the envelope would pick 1st at the low end. */
function secondGearRun(extra: TelemetrySample[] = [], v0 = 12, n = 40): { run: TelemetryRun; kinds: LimitKind[] } {
  const model = stockModel
  const samples: TelemetrySample[] = []
  let t = 0
  for (let i = 0; i < n; i++) {
    const v = v0 + i * 0.2
    const rrN = 0.015 * model.massKg * GRAVITY_MS2
    const drag = 0.5 * model.cd * model.frontalAreaM2 * model.airDensityKgM3 * v * v
    // The "car" delivers exactly the 2nd-gear modeled force
    const a = (thrustAtSpeed(model, v, 2) - drag - rrN) / model.massKg
    samples.push({ distanceM: i, timeS: t, speedMs: v, longAccelMs2: a, latAccelMs2: 0, throttle: 1, rpm: rpmIn(2, v) })
    t += 1 / v
  }
  const all = [...samples, ...extra]
  const run: TelemetryRun = { sourceName: 't', samples: all, stepM: 1, totalDistanceM: all.length, totalTimeS: t, hasThrottle: true, hasRpm: true, hasLatAccel: false, sourceRateHz: 10 }
  return { run, kinds: all.map(() => 'power' as const) }
}

describe('computeCalibrationFactor', () => {
  const model = stockModel

  it('in hold mode compares against the gear the log was in', () => {
    const { run, kinds } = secondGearRun()
    expect(computeCalibrationFactor(run, kinds, model, 'hold')).toBeCloseTo(1, 2)
    // Optimal mode assumes 1st gear at these speeds, so the same log reads as a weak engine
    expect(computeCalibrationFactor(run, kinds, model, 'optimal')).toBeLessThan(0.8)
  })

  it('ignores samples sitting on the rev limiter', () => {
    const limiterV = 25
    const onLimiter: TelemetrySample[] = Array.from({ length: 60 }, (_, i) => ({
      distanceM: 100 + i, timeS: 20 + i / limiterV, speedMs: limiterV, longAccelMs2: 0, latAccelMs2: 0, throttle: 1, rpm: rpmIn(2, limiterV),
    }))
    const { run, kinds } = secondGearRun(onLimiter)
    expect(observedLimiterRpm(run)).toBeCloseTo(rpmIn(2, limiterV), 0)
    // 60 zero-accel limiter samples would otherwise drag the median ratio toward zero
    expect(computeCalibrationFactor(run, kinds, model, 'hold')).toBeCloseTo(1, 2)
  })

  it('returns 1 with too few usable samples and undefined limiter without rpm', () => {
    const { run, kinds } = secondGearRun()
    const noRpm: TelemetryRun = { ...run, hasRpm: false, samples: run.samples.slice(0, 3) }
    expect(computeCalibrationFactor(noRpm, kinds.slice(0, 3), model)).toBe(1)
    expect(observedLimiterRpm(noRpm)).toBeUndefined()
  })

  it('a held gear makes no thrust above the observed limiter', () => {
    const v = 20
    const rpm = rpmIn(2, v)
    expect(thrustAtSpeed(model, v, 2, rpm + 100)).toBeGreaterThan(0)
    expect(thrustAtSpeed(model, v, 2, rpm - 100)).toBe(0)
  })
})

describe('traceTimeS / computeCeiling', () => {
  it('integrates distance over average speed with a floor for standing starts', () => {
    expect(traceTimeS([10, 10, 10], 1)).toBeCloseTo(0.2, 6)
    expect(traceTimeS([0, 0, 0], 1)).toBeCloseTo(4, 6) // 0.5 m/s floor
    expect(traceTimeS([10, 20, 30], 1, 1, 3)).toBeCloseTo(1 / 25, 6)
  })

  it('fixes non-power samples, caps power samples by lateral grip and back-propagates braking', () => {
    const samples = [0, 1, 2, 3, 4].map(i => ({ distanceM: i, timeS: i, speedMs: 20, longAccelMs2: 0, latAccelMs2: 0 }))
    samples[1].latAccelMs2 = 0.25 * GRAVITY_MS2 // quarter of a 1 g limit ⇒ ceiling = 20·√4 = 40
    const run: TelemetryRun = { sourceName: 't', samples, stepM: 1, totalDistanceM: 4, totalTimeS: 4, hasThrottle: false, hasRpm: false, hasLatAccel: true, sourceRateHz: 1 }
    const { ceiling, source } = computeCeiling(run, ['power', 'power', 'power', 'cornering', 'cornering'], { maxLatG: 1, maxAccelG: 0.5, maxBrakeG: 1 })
    expect(source[3]).toBe('fixed')
    expect(ceiling[3]).toBe(20)
    expect(ceiling[2]).toBeCloseTo(Math.sqrt(400 + 2 * 9.81), 3)
    expect(source[2]).toBe('braking')
    // Sample 1 carries 0.25 g lateral ⇒ braking available = 1 g·√(1 − 0.25²)
    expect(ceiling[1]).toBeCloseTo(Math.sqrt(ceiling[2] ** 2 + 2 * 9.80665 * Math.sqrt(1 - 0.0625)), 3)
    expect(ceiling[0]).toBeGreaterThan(ceiling[1])
  })
})

describe('analyzeWhatIf on a synthetic autocross run', () => {
  const run = makeRun()

  it('finds power-limited stretches and fits the baseline model to the log', () => {
    const r = analyzeWhatIf(run, car, DEFAULT_MODIFICATIONS, DEFAULT_WHATIF_OPTIONS)
    const powerSegs = r.segments.filter(s => s.kind === 'power')
    expect(powerSegs.length).toBeGreaterThanOrEqual(3)
    expect(r.powerLimitedFraction).toBeGreaterThan(0.3)
    expect(r.powerLimitedFraction).toBeLessThan(0.9)
    expect(r.segments.some(s => s.kind === 'braking')).toBe(true)
    expect(r.segments.some(s => s.kind === 'cornering')).toBe(true)
    // Synthetic car is driven by the same model, so calibration is ~1 and the fit is tight.
    // Thresholds: observed ~1.00 / ~0.1 m/s; allow 2x.
    expect(r.calibrationFactor).toBeGreaterThan(0.9)
    expect(r.calibrationFactor).toBeLessThan(1.1)
    expect(r.baselineFitRmsMs).toBeLessThan(0.6)
  })

  it('no modification ⇒ no delta', () => {
    const r = analyzeWhatIf(run, car, DEFAULT_MODIFICATIONS, DEFAULT_WHATIF_OPTIONS)
    expect(r.totalDeltaS).toBeCloseTo(0, 6)
    r.segmentResults.forEach(s => expect(s.deltaS).toBeCloseTo(0, 6))
    expect(r.modifiedSpeedsMs).toEqual(r.baselineSpeedsMs)
  })

  it('more torque ⇒ faster, higher peaks, and cornering speeds untouched', () => {
    const r = analyzeWhatIf(run, car, { ...DEFAULT_MODIFICATIONS, torqueMultiplier: 1.25 }, DEFAULT_WHATIF_OPTIONS)
    expect(r.totalDeltaS).toBeLessThan(-0.1)
    r.segmentResults.forEach(s => {
      expect(s.deltaS).toBeLessThanOrEqual(1e-9)
      expect(s.modifiedPeakMs).toBeGreaterThanOrEqual(s.baselinePeakMs)
    })
    r.kinds.forEach((k, i) => {
      if (k === 'cornering') expect(r.modifiedSpeedsMs[i]).toBe(r.measuredSpeedsMs[i])
    })
    expect(r.totalModifiedTimeS).toBeCloseTo(r.totalBaselineTimeS + r.totalDeltaS, 9)
  })

  it('more weight ⇒ slower', () => {
    const r = analyzeWhatIf(run, car, { ...DEFAULT_MODIFICATIONS, weightDeltaKg: 150 }, DEFAULT_WHATIF_OPTIONS)
    expect(r.totalDeltaS).toBeGreaterThan(0.05)
  })

  it('lots of power becomes grip-limited or braking-limited somewhere', () => {
    const r = analyzeWhatIf(run, car, { ...DEFAULT_MODIFICATIONS, torqueMultiplier: 2.5 }, DEFAULT_WHATIF_OPTIONS)
    const flagged = r.segmentResults.filter(s => s.gripLimitedAtM !== undefined || s.brakingLimitedAtM !== undefined)
    expect(flagged.length).toBeGreaterThan(0)
    // More power is never slower anywhere, and fixed sections stay measured
    r.modifiedSpeedsMs.forEach((v, i) => expect(v).toBeGreaterThanOrEqual(r.baselineSpeedsMs[i] - 1e-9))
    r.kinds.forEach((k, i) => {
      if (k === 'cornering' || k === 'driver' || k === 'grip') expect(r.modifiedSpeedsMs[i]).toBe(r.measuredSpeedsMs[i])
    })
  })

  it('a slalom with headroom reports a finite line ceiling above the driven speed', () => {
    const r = analyzeWhatIf(run, car, DEFAULT_MODIFICATIONS, DEFAULT_WHATIF_OPTIONS)
    const slalomSeg = r.segmentResults.find(s => s.segment.startM > 70 && s.segment.startM < 160 && Number.isFinite(s.lineHeadroomRatio))
    expect(slalomSeg).toBeDefined()
    expect(slalomSeg!.lineHeadroomRatio).toBeGreaterThanOrEqual(1)
    expect(slalomSeg!.lineHeadroomRatio).toBeLessThan(3)
    expect(slalomSeg!.lineHeadroomCeilingMs).toBeGreaterThan(0)
    // A pure straight has no lateral load, so no finite ceiling
    const straight = r.segmentResults.find(s => s.segment.startM >= 340 && s.segment.startM < 400)
    expect(straight).toBeDefined()
    expect(straight!.lineHeadroomRatio).toBe(Infinity)
  })

  it('calibration off uses the raw model', () => {
    const weakRun = makeRun({ thrustScale: 0.85 })
    const on = analyzeWhatIf(weakRun, car, DEFAULT_MODIFICATIONS, DEFAULT_WHATIF_OPTIONS)
    const off = analyzeWhatIf(weakRun, car, DEFAULT_MODIFICATIONS, { ...DEFAULT_WHATIF_OPTIONS, calibrate: false })
    expect(on.calibrationFactor).toBeGreaterThan(0.75)
    expect(on.calibrationFactor).toBeLessThan(0.95)
    expect(off.calibrationFactor).toBe(1)
    expect(off.baselineFitRmsMs).toBeGreaterThan(on.baselineFitRmsMs)
  })

  it('hold-gear strategy shifts where the driver did (same rpm) and reports a stretch fit', () => {
    // The synthetic driver shifts at the envelope crossovers, so a shorter final drive just
    // moves those shifts earlier: no limiter, and a time close to optimal shifting.
    const shortFd = { ...DEFAULT_MODIFICATIONS, finalDriveOverride: car.transmission.finalDriveRatio * 1.35 }
    const hold = analyzeWhatIf(run, car, shortFd, { ...DEFAULT_WHATIF_OPTIONS, gearStrategy: 'hold' })
    const optimal = analyzeWhatIf(run, car, shortFd, DEFAULT_WHATIF_OPTIONS)
    expect(hold.segmentResults.every(s => s.revLimitedAtM === undefined)).toBe(true)
    expect(Math.abs(hold.totalModifiedTimeS - optimal.totalModifiedTimeS)).toBeLessThan(0.3)
    hold.segmentResults.forEach(s => {
      expect(s.baselineFitRmsMs).toBeGreaterThanOrEqual(0)
      expect(s.baselineFitRmsMs).toBeLessThan(1)
    })
  })

  it('marks a standing start as launch and leaves it at the logged speed', () => {
    const r = analyzeWhatIf(run, car, { ...DEFAULT_MODIFICATIONS, torqueMultiplier: 1.5 }, DEFAULT_WHATIF_OPTIONS)
    expect(r.kinds[0]).toBe('launch')
    const launchLen = r.kinds.filter(k => k === 'launch').length
    expect(launchLen).toBeGreaterThan(5)
    expect(launchLen).toBeLessThanOrEqual(60)
    for (let i = 0; i < launchLen; i++) expect(r.modifiedSpeedsMs[i]).toBe(r.measuredSpeedsMs[i])
    // …and the first sample past the launch is faster than 12 m/s or 60 m in
    expect(run.samples[launchLen].speedMs >= 12 || run.samples[launchLen].distanceM >= 60).toBe(true)
  })

  it('scaleGripWithMass lets a lighter car use the same g, so weight loss helps more', () => {
    const lighter = { ...DEFAULT_MODIFICATIONS, weightDeltaKg: -100 }
    const plain = analyzeWhatIf(run, car, lighter, DEFAULT_WHATIF_OPTIONS)
    const scaled = analyzeWhatIf(run, car, lighter, { ...DEFAULT_WHATIF_OPTIONS, scaleGripWithMass: true })
    expect(plain.totalDeltaS).toBeLessThan(0)
    expect(scaled.envelope.maxLatG).toBe(plain.envelope.maxLatG)
    const heavier = analyzeWhatIf(run, car, { ...DEFAULT_MODIFICATIONS, weightDeltaKg: 100 }, { ...DEFAULT_WHATIF_OPTIONS, scaleGripWithMass: true })
    expect(heavier.envelope.maxLatG).toBeLessThan(plain.envelope.maxLatG)
  })

  it('works on a log with only time and speed', () => {
    const bare = makeRun({}, { withThrottle: false, withRpm: false, withLatAccel: false })
    expect(bare.hasLatAccel).toBe(false)
    const r = analyzeWhatIf(bare, car, { ...DEFAULT_MODIFICATIONS, torqueMultiplier: 1.2 }, DEFAULT_WHATIF_OPTIONS)
    expect(r.segmentResults.length).toBeGreaterThan(0)
    expect(r.totalDeltaS).toBeLessThan(0)
  })

  it('road dyno reproduces the modeled thrust on power samples', () => {
    const model = buildPowertrainModel(car, DEFAULT_MODIFICATIONS)
    const r = analyzeWhatIf(run, car, DEFAULT_MODIFICATIONS, DEFAULT_WHATIF_OPTIONS)
    const pts = inferRoadDyno(run.samples, r.kinds, { ...model, gravityMs2: GRAVITY_MS2 })
    expect(pts.length).toBeGreaterThan(5)
    const errs: number[] = []
    for (const p of pts) {
      if (p.count < 3 || p.speedMs < 6) continue
      const modeled = thrustAtSpeed(model, p.speedMs)
      errs.push(Math.abs(p.forceN - modeled) / modeled)
    }
    errs.sort((a, b) => a - b)
    const median = errs[Math.floor(errs.length / 2)]
    // Thresholds: observed median ≈ 2%, worst ≈ 19% (bins straddling a gear change on the
    // smoothed log); allow ~2x on the median and cap the worst at 30%
    expect(median).toBeLessThan(0.05)
    expect(errs[errs.length - 1]).toBeLessThan(0.3)
  })
})

describe('logged gears, shift rpm and the launch mark', () => {
  it('loggedGears forward-fills through undetectable samples', () => {
    const { run } = secondGearRun()
    const g = loggedGears(stockModel, run)
    expect(g.every(x => x === 2)).toBe(true)
    const noRpm: TelemetryRun = { ...run, samples: run.samples.map((s, i) => (i % 2 ? { ...s, rpm: undefined } : s)) }
    expect(loggedGears(stockModel, noRpm).every(x => x === 2)).toBe(true)
    const early: TelemetryRun = { ...run, samples: run.samples.map((s, i) => (i < 3 ? { ...s, rpm: undefined } : s)) }
    expect(loggedGears(stockModel, early).slice(0, 3)).toEqual([undefined, undefined, undefined])
  })

  it('observedShiftRpm reads the rpm just before each upshift and caps at the limiter', () => {
    const { run } = secondGearRun()
    // Append a 3rd-gear tail so the log shows one 2→3 shift
    const tail: TelemetrySample[] = Array.from({ length: 10 }, (_, i) => {
      const v = 20.2 + i * 0.2
      return { distanceM: 40 + i, timeS: 10 + i / v, speedMs: v, longAccelMs2: 1, latAccelMs2: 0, throttle: 1, rpm: rpmIn(3, v) }
    })
    const shifted: TelemetryRun = { ...run, samples: [...run.samples, ...tail] }
    const gears = loggedGears(stockModel, shifted)
    expect(gears[39]).toBe(2)
    expect(gears[45]).toBe(3)
    const shift = observedShiftRpm(shifted, gears, undefined)
    expect(shift.get(2)).toBeCloseTo(rpmIn(2, 19.8), -1)
    expect(shift.has(3)).toBe(false)
    expect(observedShiftRpm(shifted, gears, 3000).get(2)).toBe(3000)
  })

  it('a gear the driver never shifted out of is held to the limiter and flagged', () => {
    // 2nd gear from 12 to 20 m/s; the limiter is the rpm at 20 m/s in 2nd
    const { run, kinds } = secondGearRun([], 12, 40)
    const limiter = rpmIn(2, 19.8)
    const segments = [{ index: 0, kind: 'power' as const, startIdx: 0, endIdx: run.samples.length, startM: 0, endM: 39, entrySpeedMs: 12, exitSpeedMs: 19.8, peakSpeedMs: 19.8, timeS: run.totalTimeS }]
    const env = { maxLatG: 1, maxAccelG: 1, maxBrakeG: 1 }
    const modified = buildPowertrainModel(car, { ...DEFAULT_MODIFICATIONS, torqueMultiplier: 1.5 })
    const r = runWhatIfWithLimiter(run, kinds, segments, env, modified, limiter)
    expect(r.segmentResults[0].revLimitedAtM).toBeDefined()
    // Speed never exceeds the 2nd-gear limiter speed
    r.modifiedSpeedsMs.forEach(v => expect(rpmAt(stockModel, v, 2)).toBeLessThanOrEqual(limiter * 1.02))
  })

  it('markLaunch only applies to standing starts and stops at 12 m/s or 60 m', () => {
    const rolling = secondGearRun([], 15, 20)
    expect(markLaunch(rolling.run.samples, rolling.kinds).every(k => k === 'power')).toBe(true)
    const standing = secondGearRun([], 1, 80) // 1 m/s → 16.8 m/s over 80 m
    const kinds = markLaunch(standing.run.samples, standing.kinds)
    const n = kinds.filter(k => k === 'launch').length
    expect(n).toBeGreaterThan(0)
    expect(standing.run.samples[n].speedMs).toBeGreaterThanOrEqual(12)
    expect(standing.run.samples[n - 1].speedMs).toBeLessThan(12)
    const slow = secondGearRun([], 1, 100).run
    slow.samples.forEach(s => (s.speedMs = Math.min(s.speedMs, 5)))
    expect(markLaunch(slow.samples, slow.samples.map(() => 'power' as const)).filter(k => k === 'launch').length).toBe(60)
  })
})

/** Run the what-if on a hand-built run with an explicit limiter (hold mode). */
function runWhatIfWithLimiter(
  run: TelemetryRun,
  kinds: LimitKind[],
  segments: import('@/types/telemetry').RunSegment[],
  envelope: import('@/types/telemetry').GripEnvelope,
  modified: ReturnType<typeof buildPowertrainModel>,
  limiter: number,
) {
  // observedLimiterRpm reads the 99.5th percentile of rpm; the run tops out at the limiter by construction
  expect(observedLimiterRpm(run)).toBeCloseTo(limiter, -1)
  return runWhatIf({ run, kinds, segments, envelope, baseline: stockModel, modified, options: { ...DEFAULT_WHATIF_OPTIONS, gearStrategy: 'hold', calibrate: false } })
}
