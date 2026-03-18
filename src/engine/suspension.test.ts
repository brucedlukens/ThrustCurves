import { describe, it, expect } from 'vitest'
import { wheelRateNPerM, suspensionFrequencyHz, frequencyRatio } from './suspension'

describe('wheelRateNPerM', () => {
  it('returns spring rate when motion ratio is 1.0', () => {
    expect(wheelRateNPerM(50000, 1.0)).toBe(50000)
  })

  it('scales with motion ratio squared', () => {
    const rate = wheelRateNPerM(50000, 0.7)
    expect(rate).toBeCloseTo(50000 * 0.49, 4)
  })

  it('returns zero when spring rate is zero', () => {
    expect(wheelRateNPerM(0, 0.8)).toBe(0)
  })

  it('handles motion ratio greater than 1', () => {
    expect(wheelRateNPerM(50000, 1.2)).toBeCloseTo(50000 * 1.44, 4)
  })
})

describe('suspensionFrequencyHz', () => {
  it('computes known value: 10 N/m spring, 1 kg mass, MR=1', () => {
    // f = (1/2π) × √(10/1) = 0.50329 Hz
    const freq = suspensionFrequencyHz(10, 1)
    expect(freq).toBeCloseTo(0.50329, 4)
  })

  it('computes realistic suspension: 35 kN/m wheel rate, 350 kg corner', () => {
    // f = (1/2π) × √(35000/350) = (1/2π) × 10 = 1.5915 Hz
    const freq = suspensionFrequencyHz(35000, 350)
    expect(freq).toBeCloseTo(1.5915, 3)
  })

  it('higher spring rate gives higher frequency', () => {
    const f1 = suspensionFrequencyHz(30000, 300)
    const f2 = suspensionFrequencyHz(60000, 300)
    expect(f2).toBeGreaterThan(f1)
    // Should scale with sqrt(2)
    expect(f2 / f1).toBeCloseTo(Math.SQRT2, 4)
  })

  it('higher mass gives lower frequency', () => {
    const f1 = suspensionFrequencyHz(40000, 200)
    const f2 = suspensionFrequencyHz(40000, 400)
    expect(f2).toBeLessThan(f1)
    expect(f1 / f2).toBeCloseTo(Math.SQRT2, 4)
  })

  it('returns 0 for zero spring rate', () => {
    expect(suspensionFrequencyHz(0, 300)).toBe(0)
  })

  it('returns 0 for zero mass', () => {
    expect(suspensionFrequencyHz(35000, 0)).toBe(0)
  })

  it('returns 0 for negative inputs', () => {
    expect(suspensionFrequencyHz(-1000, 300)).toBe(0)
    expect(suspensionFrequencyHz(35000, -100)).toBe(0)
  })
})

describe('frequencyRatio', () => {
  it('returns ratio of rear to front', () => {
    expect(frequencyRatio(1.5, 1.65)).toBeCloseTo(1.1, 4)
  })

  it('returns 1.0 when frequencies are equal', () => {
    expect(frequencyRatio(2.0, 2.0)).toBeCloseTo(1.0, 4)
  })

  it('returns 0 when front frequency is zero', () => {
    expect(frequencyRatio(0, 1.5)).toBe(0)
  })

  it('returns value less than 1 when front is higher', () => {
    expect(frequencyRatio(2.0, 1.5)).toBeCloseTo(0.75, 4)
  })
})
