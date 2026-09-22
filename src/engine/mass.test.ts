import { describe, it, expect } from 'vitest'
import { driverMassKg, vehicleMassKg } from './mass'
import { runSimulation } from './index'
import { buildPowertrainModel } from './telemetry/whatif'
import { DEFAULT_MODIFICATIONS } from '@/types/config'
import { DEFAULT_DRIVER_MASS_KG } from '@/data/presets'
import { getTestCar } from '@/test/telemetryFixtures'

describe('vehicle mass', () => {
  const car = getTestCar()

  it('defaults the driver to ≈200 lb and always includes them', () => {
    expect(DEFAULT_DRIVER_MASS_KG).toBe(91)
    expect(driverMassKg(DEFAULT_MODIFICATIONS)).toBe(91)
    expect(driverMassKg({ driverMassKg: 75 })).toBe(75)
    expect(vehicleMassKg(car, DEFAULT_MODIFICATIONS)).toBe(car.curbWeightKg + 91)
    expect(vehicleMassKg(car, { ...DEFAULT_MODIFICATIONS, weightDeltaKg: -50, driverMassKg: 80 })).toBe(car.curbWeightKg + 30)
  })

  it('runSimulation and the telemetry powertrain model both carry the driver', () => {
    const withDriver = runSimulation(car, DEFAULT_MODIFICATIONS)
    const noDriver = runSimulation(car, { ...DEFAULT_MODIFICATIONS, driverMassKg: 0 })
    expect(withDriver.performance.zeroTo60Mph!).toBeGreaterThan(noDriver.performance.zeroTo60Mph!)
    expect(buildPowertrainModel(car, DEFAULT_MODIFICATIONS).massKg).toBe(car.curbWeightKg + 91)
    expect(buildPowertrainModel(car, { ...DEFAULT_MODIFICATIONS, driverMassKg: 0 }).massKg).toBe(car.curbWeightKg)
  })
})
