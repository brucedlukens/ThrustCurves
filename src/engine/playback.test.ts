import { describe, it, expect } from 'vitest'
import { playbackDurationS, sampleTrace } from './playback'
import type { TimeStep } from '@/types/simulation'

function step(timeS: number, speedMs: number, distanceM: number, gear = 1, thrustN = 1000): TimeStep {
  return { timeS, speedMs, distanceM, accelerationMs2: 0, gear, rpm: 0, thrustN, dragN: 0, netForceN: thrustN }
}

const TRACE: TimeStep[] = [
  step(0, 0, 0),
  step(1, 2, 1),
  step(2, 4, 4, 2, 0), // mid-shift: no drive force
  step(3, 5, 8.5, 2),
]

describe('sampleTrace', () => {
  it('returns the first step at or before the start', () => {
    expect(sampleTrace(TRACE, -1)).toEqual({ speedMs: 0, distanceM: 0, gear: 1, shifting: false })
  })

  it('interpolates speed and distance between steps', () => {
    const s = sampleTrace(TRACE, 0.5)
    expect(s.speedMs).toBeCloseTo(1, 9)
    expect(s.distanceM).toBeCloseTo(0.5, 9)
    expect(s.gear).toBe(1)
  })

  it('flags a gear change in progress', () => {
    const s = sampleTrace(TRACE, 2.5)
    expect(s.gear).toBe(2)
    expect(s.shifting).toBe(true)
  })

  it('holds the last speed past the end of the trace', () => {
    const s = sampleTrace(TRACE, 5)
    expect(s.speedMs).toBe(5)
    expect(s.distanceM).toBeCloseTo(8.5 + 5 * 2, 9)
    expect(s.shifting).toBe(false)
  })

  it('is at rest for an empty trace', () => {
    expect(sampleTrace([], 3)).toEqual({ speedMs: 0, distanceM: 0, gear: 1, shifting: false })
  })
})

describe('playbackDurationS', () => {
  it('plays until the slowest finisher plus a tail', () => {
    const runs = [
      { trace: TRACE, finishTimeS: 3 },
      { trace: TRACE, finishTimeS: 7 },
      { trace: [...TRACE, step(40, 5, 100)], finishTimeS: null },
    ]
    expect(playbackDurationS(runs, 1.5)).toBe(8.5)
  })

  it('plays every trace to its end when nobody finishes', () => {
    const runs = [
      { trace: TRACE, finishTimeS: null },
      { trace: [...TRACE, step(12, 5, 40)], finishTimeS: null },
    ]
    expect(playbackDurationS(runs)).toBe(12)
  })

  it('is zero with no runs', () => {
    expect(playbackDurationS([])).toBe(0)
  })
})
