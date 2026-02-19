import { describe, it, expect } from 'vitest'
import { tireRadiusM, rollingResistanceN } from './tires'
import type { TireSize } from '@/types/car'

describe('tireRadiusM', () => {
  it('calculates radius for 275/35R19 (Supra rear)', () => {
    const tire: TireSize = { widthMm: 275, aspectRatio: 35, rimDiameterIn: 19 }
    // rimRadius = 19 * 0.0254 / 2 = 0.2413
    // sidewall = 275 * 35 / 100 / 1000 = 0.09625
    // total = 0.33755
    expect(tireRadiusM(tire)).toBeCloseTo(0.33755, 4)
  })

  it('calculates radius for 245/40R18 (common fitment)', () => {
    const tire: TireSize = { widthMm: 245, aspectRatio: 40, rimDiameterIn: 18 }
    // rimRadius = 18 * 0.0254 / 2 = 0.2286
    // sidewall = 245 * 40 / 100 / 1000 = 0.098
    // total = 0.3266
    expect(tireRadiusM(tire)).toBeCloseTo(0.3266, 4)
  })

  it('calculates radius for 205/55R16 (economy car)', () => {
    const tire: TireSize = { widthMm: 205, aspectRatio: 55, rimDiameterIn: 16 }
    // rimRadius = 16 * 0.0254 / 2 = 0.2032
    // sidewall = 205 * 55 / 100 / 1000 = 0.11275
    // total = 0.31595
    expect(tireRadiusM(tire)).toBeCloseTo(0.31595, 4)
  })
})

describe('rollingResistanceN', () => {
  it('computes rolling resistance force', () => {
    // 1565 kg * 0.015 * 9.81 = 230.29 N
    expect(rollingResistanceN(1565, 0.015, 9.81)).toBeCloseTo(230.29, 1)
  })

  it('scales linearly with mass', () => {
    const f1 = rollingResistanceN(1000, 0.015, 9.81)
    const f2 = rollingResistanceN(2000, 0.015, 9.81)
    expect(f2).toBeCloseTo(f1 * 2, 5)
  })

  it('scales linearly with Crr', () => {
    const f1 = rollingResistanceN(1500, 0.010, 9.81)
    const f2 = rollingResistanceN(1500, 0.020, 9.81)
    expect(f2).toBeCloseTo(f1 * 2, 5)
  })
})
