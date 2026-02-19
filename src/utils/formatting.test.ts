import { describe, test, expect } from 'vitest'
import { fmtTime, fmtSpeed, fmtForce, fmtDistance, fmtRpm } from './formatting'

describe('formatting', () => {
  test('fmtTime: formats seconds to 2 decimal places', () => {
    expect(fmtTime(3.456)).toBe('3.46s')
  })

  test('fmtTime: returns em-dash for undefined', () => {
    expect(fmtTime(undefined)).toBe('—')
  })

  test('fmtSpeed: formats m/s as mph', () => {
    // 26.8224 m/s ≈ 60.0 mph
    const result = fmtSpeed(26.8224)
    expect(result).toMatch(/60\.\d+ mph/)
  })

  test('fmtSpeed: returns em-dash for undefined', () => {
    expect(fmtSpeed(undefined)).toBe('—')
  })

  test('fmtForce: converts N to lbf and rounds', () => {
    // 100 N * 0.224809 ≈ 22 lbf
    const result = fmtForce(100)
    expect(result).toMatch(/\d+ lbf/)
  })

  test('fmtDistance: converts m to ft and rounds', () => {
    // 402.336 m = 1320 ft (quarter mile)
    const result = fmtDistance(402.336)
    expect(result).toMatch(/132\d ft/)
  })

  test('fmtRpm: formats RPM', () => {
    expect(fmtRpm(6500)).toBe('6500 RPM')
  })
})
