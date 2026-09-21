import { describe, it, expect } from 'vitest'
import { classifySamples, smoothKinds, segmentRun } from './classify'
import { computeGripEnvelope, longitudinalAvailableG, percentile, G } from './envelope'
import type { GripEnvelope, LimitKind, TelemetrySample } from '@/types/telemetry'

function sample(over: Partial<TelemetrySample>): TelemetrySample {
  return { distanceM: 0, timeS: 0, speedMs: 20, longAccelMs2: 0, latAccelMs2: 0, ...over }
}

describe('envelope', () => {
  it('percentile interpolates and ignores NaN', () => {
    expect(percentile([1, 2, 3, 4, NaN], 0.5)).toBe(2.5)
    expect(percentile([], 0.5)).toBeNaN()
    expect(percentile([7], 0.98)).toBe(7)
  })

  it('reads the g-g edge with a high percentile and applies floors', () => {
    const samples: TelemetrySample[] = []
    for (let i = 0; i < 100; i++) {
      samples.push(sample({ longAccelMs2: 0.5 * G, latAccelMs2: 1.0 * G }))
      samples.push(sample({ longAccelMs2: -0.9 * G }))
    }
    samples.push(sample({ longAccelMs2: 5 * G, latAccelMs2: 5 * G })) // spike
    const env = computeGripEnvelope(samples, true)
    expect(env.maxLatG).toBeCloseTo(1.0, 1)
    // Observed 0.5 g accel is below 0.6 × lateral, so the traction estimate wins
    expect(env.maxAccelG).toBeCloseTo(0.6, 1)
    expect(env.maxBrakeG).toBeCloseTo(0.9, 1)
    // A high-power car that shows more accel than the traction estimate keeps the observed value
    const strong = samples.map(s => ({ ...s, longAccelMs2: s.longAccelMs2 > 0 ? 0.8 * G : s.longAccelMs2 }))
    expect(computeGripEnvelope(strong, true).maxAccelG).toBeCloseTo(0.8, 1)
  })

  it('uses the default lateral limit when the log has no lateral source and honors overrides', () => {
    const env = computeGripEnvelope([sample({})], false)
    expect(env.maxLatG).toBe(1.0)
    expect(env.maxAccelG).toBeCloseTo(0.6, 6)
    expect(env.maxBrakeG).toBe(0.3)
    expect(computeGripEnvelope([sample({})], false, { maxAccelG: 0.9 }).maxAccelG).toBe(0.9)
    expect(computeGripEnvelope([sample({})], false, { maxLatG: 1.3 }).maxLatG).toBe(1.3)
  })

  it('friction ellipse reduces longitudinal g with lateral usage', () => {
    expect(longitudinalAvailableG(1, 0)).toBe(1)
    expect(longitudinalAvailableG(1, 1)).toBe(0)
    expect(longitudinalAvailableG(1, 2)).toBe(0)
    expect(longitudinalAvailableG(0.6, 0.6)).toBeCloseTo(0.48, 3)
  })
})

describe('classifySamples', () => {
  const env: GripEnvelope = { maxLatG: 1.0, maxAccelG: 0.5, maxBrakeG: 1.0 }

  it('labels braking, cornering, grip, power and driver', () => {
    const kinds = classifySamples(
      [
        sample({ longAccelMs2: -0.5 * G }),
        sample({ latAccelMs2: 0.95 * G }),
        sample({ longAccelMs2: 0.48 * G }),
        sample({ longAccelMs2: 0.2 * G, throttle: 1 }),
        sample({ longAccelMs2: 0.2 * G, throttle: 0.4 }),
        sample({ longAccelMs2: 0.0 }),
      ],
      env,
      { hasThrottle: true },
    )
    expect(kinds).toEqual(['braking', 'cornering', 'grip', 'power', 'driver', 'driver'])
  })

  it('treats accelerating inside the circle as power when no throttle channel exists', () => {
    const kinds = classifySamples([sample({ longAccelMs2: 0.2 * G })], env, { hasThrottle: false })
    expect(kinds).toEqual(['power'])
  })

  it('combined accel + lateral at the edge is grip', () => {
    // 0.35 long/0.5 = 0.7, lat 0.6 ⇒ hypot ≈ 0.92 ≥ 0.85
    expect(classifySamples([sample({ longAccelMs2: 0.35 * G, latAccelMs2: 0.6 * G })], env, { hasThrottle: false })).toEqual(['grip'])
  })
})

describe('smoothKinds + segmentRun', () => {
  const P = 'power' as const
  const B = 'braking' as const

  it('absorbs runs shorter than the minimum into the previous run', () => {
    const kinds: LimitKind[] = [P, P, P, P, P, 'driver', 'driver', P, P, P, P, P]
    expect(smoothKinds(kinds, 1)).toEqual(Array(12).fill(P))
  })

  it('absorbs a short run at the very start into the next run', () => {
    const kinds: LimitKind[] = ['driver', P, P, P, P, P]
    expect(smoothKinds(kinds, 1)).toEqual(Array(6).fill(P))
  })

  it('keeps runs at or above the minimum length', () => {
    const kinds: LimitKind[] = [P, P, P, P, P, B, B, B, B, B, P, P, P, P, P]
    expect(smoothKinds(kinds, 1)).toEqual(kinds)
  })

  it('scales the minimum with the grid step', () => {
    // 2 m step ⇒ minimum 3 samples (round(5 / 2)); a 2-sample run gets absorbed, 3 stays
    expect(smoothKinds([P, P, P, B, B, P, P, P], 2)).toEqual(Array(8).fill(P))
    expect(smoothKinds([P, P, P, B, B, B, P, P, P], 2)).toEqual([P, P, P, B, B, B, P, P, P])
  })

  it('segments consecutive kinds with entry/exit/peak stats', () => {
    const samples = [0, 1, 2, 3, 4, 5].map(i =>
      sample({ distanceM: i, timeS: i * 0.1, speedMs: i < 3 ? 10 + i : 20 - i }),
    )
    const kinds: LimitKind[] = ['power', 'power', 'power', 'braking', 'braking', 'braking']
    const segs = segmentRun(samples, kinds)
    expect(segs).toHaveLength(2)
    expect(segs[0]).toMatchObject({ index: 0, kind: 'power', startIdx: 0, endIdx: 3, startM: 0, endM: 3, entrySpeedMs: 10, peakSpeedMs: 12 })
    expect(segs[1]).toMatchObject({ index: 1, kind: 'braking', startIdx: 3, endIdx: 6, startM: 3, endM: 5 })
    expect(segs[1].timeS).toBeCloseTo(0.2, 6)
  })
})
