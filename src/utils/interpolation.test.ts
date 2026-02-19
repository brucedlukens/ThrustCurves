import { describe, it, expect } from 'vitest'
import { interpolate } from './interpolation'
import type { CurvePoint } from '@/types/car'

describe('interpolate', () => {
  const curve: CurvePoint[] = [
    [0, 0],
    [100, 50],
    [200, 80],
    [300, 60],
  ]

  it('returns first value when x is below range', () => {
    expect(interpolate(curve, -10)).toBe(0)
    expect(interpolate(curve, 0)).toBe(0)
  })

  it('returns last value when x is above range', () => {
    expect(interpolate(curve, 400)).toBe(60)
    expect(interpolate(curve, 300)).toBe(60)
  })

  it('returns exact values at breakpoints', () => {
    expect(interpolate(curve, 0)).toBe(0)
    expect(interpolate(curve, 100)).toBe(50)
    expect(interpolate(curve, 200)).toBe(80)
    expect(interpolate(curve, 300)).toBe(60)
  })

  it('linearly interpolates between points', () => {
    // midpoint between [0,0] and [100,50] → 25
    expect(interpolate(curve, 50)).toBeCloseTo(25, 5)
    // midpoint between [100,50] and [200,80] → 65
    expect(interpolate(curve, 150)).toBeCloseTo(65, 5)
    // midpoint between [200,80] and [300,60] → 70
    expect(interpolate(curve, 250)).toBeCloseTo(70, 5)
  })

  it('returns 0 for empty curve', () => {
    expect(interpolate([], 50)).toBe(0)
  })

  it('handles single-point curve', () => {
    const single: CurvePoint[] = [[1000, 42]]
    expect(interpolate(single, 500)).toBe(42)
    expect(interpolate(single, 1000)).toBe(42)
    expect(interpolate(single, 2000)).toBe(42)
  })
})
