/**
 * Integration tests: run full simulation on real OEM car data.
 * Validates against known published 0-60 times (generous bounds,
 * since we model ideal traction with no wheel-spin limits).
 */
import { describe, it, expect } from 'vitest'
import { runSimulation } from './index'
import carsJson from '@/data/cars.json'
import type { CarSpec } from '@/types/car'
import { DEFAULT_MODIFICATIONS } from '@/types/config'

const cars = carsJson as CarSpec[]
const stockMods = { ...DEFAULT_MODIFICATIONS }

function getCarById(id: string): CarSpec {
  const car = cars.find((c) => c.id === id)
  if (!car) throw new Error(`Car not found: ${id}`)
  return car
}

describe('runSimulation - SimulationResult structure', () => {
  it('returns all required fields for the Supra', () => {
    const car = getCarById('toyota-supra-2020')
    const result = runSimulation(car, stockMods)

    expect(result.gearCurves).toBeDefined()
    expect(result.envelope).toBeDefined()
    expect(result.shiftPoints).toBeDefined()
    expect(result.performance).toBeDefined()
    expect(result.trace).toBeDefined()
  })

  it('gear curves count matches transmission gear count', () => {
    const car = getCarById('toyota-supra-2020')
    const result = runSimulation(car, stockMods)
    expect(result.gearCurves).toHaveLength(car.transmission.gearRatios.length)
  })

  it('shift points count is gears - 1', () => {
    const car = getCarById('toyota-supra-2020')
    const result = runSimulation(car, stockMods)
    expect(result.shiftPoints).toHaveLength(car.transmission.gearRatios.length - 1)
  })

  it('trace has time steps starting from 0', () => {
    const car = getCarById('toyota-supra-2020')
    const result = runSimulation(car, stockMods)
    expect(result.trace.length).toBeGreaterThan(0)
    expect(result.trace[0].timeS).toBe(0)
    expect(result.trace[0].speedMs).toBe(0)
  })
})

describe('runSimulation - Toyota Supra 2020 (published 0-60: ~3.9-4.1s)', () => {
  it('0-60 mph time is within plausible range (2-7 seconds)', () => {
    const car = getCarById('toyota-supra-2020')
    const result = runSimulation(car, stockMods)
    // No traction limit → expect faster than real, but in same ballpark
    expect(result.performance.zeroTo60Mph).toBeDefined()
    expect(result.performance.zeroTo60Mph!).toBeGreaterThan(2)
    expect(result.performance.zeroTo60Mph!).toBeLessThan(7)
  })

  it('quarter mile time is within plausible range (9-14 seconds)', () => {
    const car = getCarById('toyota-supra-2020')
    const result = runSimulation(car, stockMods)
    expect(result.performance.quarterMileS).toBeDefined()
    expect(result.performance.quarterMileS!).toBeGreaterThan(9)
    expect(result.performance.quarterMileS!).toBeLessThan(14)
  })
})

describe('runSimulation - Ford Mustang GT 2024 (published 0-60: ~4.3-4.6s)', () => {
  it('0-60 mph time is within plausible range (2-8 seconds)', () => {
    const car = getCarById('ford-mustang-gt-2024')
    const result = runSimulation(car, stockMods)
    expect(result.performance.zeroTo60Mph).toBeDefined()
    expect(result.performance.zeroTo60Mph!).toBeGreaterThan(2)
    expect(result.performance.zeroTo60Mph!).toBeLessThan(8)
  })
})

describe('runSimulation - BMW M3 Competition (published 0-60: ~3.8s)', () => {
  it('0-60 mph time is within plausible range (2-7 seconds)', () => {
    const car = getCarById('bmw-m3-competition-2021')
    const result = runSimulation(car, stockMods)
    expect(result.performance.zeroTo60Mph).toBeDefined()
    expect(result.performance.zeroTo60Mph!).toBeGreaterThan(2)
    expect(result.performance.zeroTo60Mph!).toBeLessThan(7)
  })
})

describe('runSimulation - modification effects', () => {
  it('weight reduction improves 0-60 time', () => {
    const car = getCarById('toyota-supra-2020')
    const stockResult = runSimulation(car, stockMods)
    const lightMods = { ...stockMods, weightDeltaKg: -100 }
    const lightResult = runSimulation(car, lightMods)

    expect(lightResult.performance.zeroTo60Mph!).toBeLessThan(
      stockResult.performance.zeroTo60Mph!,
    )
  })

  it('torque multiplier > 1 improves 0-60 time', () => {
    const car = getCarById('toyota-supra-2020')
    const stockResult = runSimulation(car, stockMods)
    const tuneMods = { ...stockMods, torqueMultiplier: 1.2 }
    const tuneResult = runSimulation(car, tuneMods)

    expect(tuneResult.performance.zeroTo60Mph!).toBeLessThan(
      stockResult.performance.zeroTo60Mph!,
    )
  })

  it('altitude (Denver) reduces performance for NA engine', () => {
    const car = getCarById('ford-mustang-gt-2024') // NA engine
    const seaLevelResult = runSimulation(car, { ...stockMods, altitudeM: 0 })
    const denverResult = runSimulation(car, { ...stockMods, altitudeM: 1609 })

    expect(denverResult.performance.zeroTo60Mph!).toBeGreaterThan(
      seaLevelResult.performance.zeroTo60Mph!,
    )
  })

  it('altitude (Denver) has smaller effect on turbo engine', () => {
    const supraResult0 = runSimulation(getCarById('toyota-supra-2020'), { ...stockMods, altitudeM: 0 })
    const supraResult1609 = runSimulation(getCarById('toyota-supra-2020'), { ...stockMods, altitudeM: 1609 })
    const mustangResult0 = runSimulation(getCarById('ford-mustang-gt-2024'), { ...stockMods, altitudeM: 0 })
    const mustangResult1609 = runSimulation(getCarById('ford-mustang-gt-2024'), { ...stockMods, altitudeM: 1609 })

    const supraDelta = supraResult1609.performance.zeroTo60Mph! - supraResult0.performance.zeroTo60Mph!
    const mustangDelta = mustangResult1609.performance.zeroTo60Mph! - mustangResult0.performance.zeroTo60Mph!

    // Turbo (Supra) should be less affected by altitude than NA (Mustang)
    expect(supraDelta).toBeLessThan(mustangDelta)
  })
})

describe('runSimulation - envelope properties', () => {
  it('envelope thrust is always positive', () => {
    const car = getCarById('toyota-supra-2020')
    const result = runSimulation(car, stockMods)
    for (const pt of result.envelope) {
      expect(pt.forceN).toBeGreaterThan(0)
    }
  })

  it('top speed is positive', () => {
    const car = getCarById('toyota-supra-2020')
    const result = runSimulation(car, stockMods)
    expect(result.performance.topSpeedMs).toBeDefined()
    expect(result.performance.topSpeedMs!).toBeGreaterThan(0)
  })
})
