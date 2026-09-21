import { describe, it, expect } from 'vitest'
import { buildRun, movingAverage, derivative, interpolateOnGrid } from './resample'
import { parseCsv } from './csv'
import { autoDetectMapping } from './mapping'
import { getTestCar, rowsToCsv, synthesizeRun } from '@/test/telemetryFixtures'

describe('helpers', () => {
  it('movingAverage smooths and skips NaN', () => {
    expect(movingAverage([1, 1, 4, 1, 1], 3)).toEqual([1, 2, 2, 2, 1])
    expect(movingAverage([1, NaN, 3], 3)).toEqual([1, 2, 3])
    expect(movingAverage([1, 2], 1)).toEqual([1, 2])
  })

  it('derivative uses central differences', () => {
    expect(derivative([0, 1, 2, 3], [0, 1, 2, 3])).toEqual([1, 1, 1, 1])
    expect(derivative([5], [0])).toEqual([0])
  })

  it('interpolateOnGrid clamps at the ends', () => {
    expect(interpolateOnGrid([0, 10], [0, 100], [-1, 5, 20])).toEqual([0, 50, 100])
  })
})

describe('buildRun', () => {
  const car = getTestCar()

  it('resamples a synthetic log onto a 1 m grid with SI units', () => {
    const rows = synthesizeRun(car, [{ kind: 'straight', lengthM: 100 }], { rateHz: 10 })
    const table = parseCsv(rowsToCsv(rows))
    const run = buildRun(table, autoDetectMapping(table.headers), { sourceName: 'x' })
    expect(run.sourceName).toBe('x')
    expect(run.stepM).toBe(1)
    expect(run.samples.length).toBeGreaterThanOrEqual(95)
    expect(run.samples[0].distanceM).toBe(0)
    expect(run.samples[1].distanceM).toBe(1)
    expect(run.hasThrottle).toBe(true)
    expect(run.hasRpm).toBe(true)
    expect(run.hasLatAccel).toBe(true)
    expect(run.sourceRateHz).toBeCloseTo(10, 0)
    // Speed is monotonically rising on a full-throttle straight
    const speeds = run.samples.map(s => s.speedMs)
    for (let i = 1; i < speeds.length; i++) expect(speeds[i]).toBeGreaterThanOrEqual(speeds[i - 1] - 0.01)
    // Last sample within a few % of the logged final speed
    expect(run.samples[run.samples.length - 1].speedMs).toBeCloseTo(rows[rows.length - 1].speedMs, -1)
    // Throttle is pinned
    expect(run.samples[50].throttle).toBeCloseTo(1, 2)
  })

  it('derives longitudinal accel from speed when no accel channel exists', () => {
    const t = parseCsv('t,speed\n0,0\n1,10\n2,20\n3,30\n4,40\n5,50\n')
    const m = autoDetectMapping(t.headers)
    m.speedUnit = 'ms'
    const run = buildRun(t, m)
    // 10 m/s² constant; check mid-run sample
    const mid = run.samples[Math.floor(run.samples.length / 2)]
    expect(mid.longAccelMs2).toBeCloseTo(10, 0)
    expect(run.hasLatAccel).toBe(false)
    expect(run.hasThrottle).toBe(false)
    expect(mid.latAccelMs2).toBe(0)
  })

  it('derives lateral accel from GPS heading rate when no lateral channel exists', () => {
    const rows = synthesizeRun(car, [
      { kind: 'straight', lengthM: 40 },
      { kind: 'corner', lengthM: 60, speedMs: 15, latG: 0.9 },
    ], { rateHz: 20 })
    const table = parseCsv(rowsToCsv(rows, { withLatAccel: false, withGps: true }))
    const run = buildRun(table, autoDetectMapping(table.headers))
    expect(run.hasLatAccel).toBe(true)
    const inCorner = run.samples.filter(s => s.distanceM > 60 && s.distanceM < 90)
    const meanLatG = inCorner.reduce((a, s) => a + s.latAccelMs2, 0) / inCorner.length / 9.80665
    // Threshold: GPS-derived yaw × speed lands within ~25% of the true 0.9 g on synthetic data
    expect(meanLatG).toBeGreaterThan(0.65)
    expect(meanLatG).toBeLessThan(1.15)
  })

  it('uses a logged distance column when present and converts units', () => {
    const t = parseCsv('Time (s),Speed (mph),Distance (ft)\n0,10,0\n1,10,32.8084\n2,10,65.6168\n3,10,98.4252\n4,10,131.234\n')
    const run = buildRun(t, autoDetectMapping(t.headers))
    expect(run.totalDistanceM).toBeCloseTo(40, 1)
    expect(run.samples[10].speedMs).toBeCloseTo(4.4704, 2)
  })

  it('handles millisecond time and drops non-increasing rows', () => {
    const t = parseCsv('Interval|ms,Speed|mph\n0,10\n100,10\n100,10\n200,10\n300,10\n400,10\n500,10\n')
    const run = buildRun(t, autoDetectMapping(t.headers))
    expect(run.totalTimeS).toBeCloseTo(0.5, 3)
    expect(run.sourceRateHz).toBeCloseTo(10, 0)
  })

  it('throws on missing required channels or too few rows', () => {
    const t = parseCsv('a,b\n1,2\n3,4\n5,6\n')
    expect(() => buildRun(t, autoDetectMapping(t.headers))).toThrow(/required/)
    const t2 = parseCsv('time,speed\n0,1\n1,2\n')
    expect(() => buildRun(t2, autoDetectMapping(t2.headers))).toThrow(/at least 5/)
  })

  it('throws when the car never moves', () => {
    const t = parseCsv('time,speed\n0,0\n1,0\n2,0\n3,0\n4,0\n5,0\n')
    expect(() => buildRun(t, autoDetectMapping(t.headers))).toThrow(/no movement/)
  })
})
