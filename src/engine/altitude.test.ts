import { describe, it, expect } from 'vitest'
import { airDensityAtAltitude, naPowerCorrection, turboPowerCorrection } from './altitude'

describe('airDensityAtAltitude', () => {
  it('returns sea-level density at 0 m', () => {
    expect(airDensityAtAltitude(0)).toBeCloseTo(1.225, 4)
  })

  it('returns lower density at Denver (1609 m)', () => {
    // Expected: ~1.007 kg/m³
    const density = airDensityAtAltitude(1609)
    expect(density).toBeGreaterThan(0.95)
    expect(density).toBeLessThan(1.10)
    expect(density).toBeCloseTo(1.007, 2)
  })

  it('returns lower density at Mexico City (2240 m)', () => {
    const density = airDensityAtAltitude(2240)
    expect(density).toBeLessThan(airDensityAtAltitude(1609))
    expect(density).toBeGreaterThan(0.9)
  })

  it('decreases monotonically with altitude', () => {
    const altitudes = [0, 500, 1000, 2000, 3000]
    for (let i = 1; i < altitudes.length; i++) {
      expect(airDensityAtAltitude(altitudes[i])).toBeLessThan(
        airDensityAtAltitude(altitudes[i - 1]),
      )
    }
  })
})

describe('naPowerCorrection', () => {
  it('returns 1.0 at sea level', () => {
    expect(naPowerCorrection(0)).toBeCloseTo(1.0, 5)
  })

  it('returns ~0.82 at Denver (1609 m)', () => {
    // Standard rule: ~3% per 1000 ft, Denver is ~5280 ft → ~15-18% loss
    const correction = naPowerCorrection(1609)
    expect(correction).toBeGreaterThan(0.78)
    expect(correction).toBeLessThan(0.90)
  })

  it('decreases with altitude', () => {
    expect(naPowerCorrection(1000)).toBeLessThan(naPowerCorrection(0))
    expect(naPowerCorrection(2000)).toBeLessThan(naPowerCorrection(1000))
  })
})

describe('turboPowerCorrection', () => {
  it('returns 1.0 at sea level', () => {
    expect(turboPowerCorrection(0)).toBeCloseTo(1.0, 5)
  })

  it('loses less power than NA at altitude', () => {
    const altitude = 1609
    expect(turboPowerCorrection(altitude)).toBeGreaterThan(naPowerCorrection(altitude))
  })

  it('turbo loss is approximately 1/3 of NA loss at Denver', () => {
    const naLoss = 1 - naPowerCorrection(1609)
    const turboLoss = 1 - turboPowerCorrection(1609)
    expect(turboLoss).toBeCloseTo(naLoss / 3, 5)
  })

  it('decreases with altitude', () => {
    expect(turboPowerCorrection(1000)).toBeLessThan(turboPowerCorrection(0))
    expect(turboPowerCorrection(2000)).toBeLessThan(turboPowerCorrection(1000))
  })
})
