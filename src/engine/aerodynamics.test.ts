import { describe, it, expect } from 'vitest'
import { dragForceN } from './aerodynamics'

describe('dragForceN', () => {
  it('returns zero at zero speed', () => {
    expect(dragForceN(0.32, 2.0, 1.225, 0)).toBe(0)
  })

  it('computes drag at sea level (Supra at 100 km/h)', () => {
    // 100 km/h = 27.778 m/s
    // F = 0.5 * 0.32 * 2.0 * 1.225 * 27.778² = 302.6 N
    const speed = 100 / 3.6
    const result = dragForceN(0.32, 2.0, 1.225, speed)
    expect(result).toBeCloseTo(302.6, 0)
  })

  it('scales with square of speed', () => {
    const f1 = dragForceN(0.30, 2.0, 1.225, 20)
    const f2 = dragForceN(0.30, 2.0, 1.225, 40)
    expect(f2).toBeCloseTo(f1 * 4, 4)
  })

  it('scales linearly with Cd', () => {
    const f1 = dragForceN(0.25, 2.0, 1.225, 30)
    const f2 = dragForceN(0.50, 2.0, 1.225, 30)
    expect(f2).toBeCloseTo(f1 * 2, 5)
  })

  it('scales linearly with frontal area', () => {
    const f1 = dragForceN(0.30, 1.5, 1.225, 30)
    const f2 = dragForceN(0.30, 3.0, 1.225, 30)
    expect(f2).toBeCloseTo(f1 * 2, 5)
  })

  it('scales linearly with air density', () => {
    const f1 = dragForceN(0.30, 2.0, 1.0, 30)
    const f2 = dragForceN(0.30, 2.0, 2.0, 30)
    expect(f2).toBeCloseTo(f1 * 2, 5)
  })
})
