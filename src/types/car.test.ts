import { describe, it, expect } from 'vitest'
import type { CarSpec, TireSize, EngineSpec, TransmissionSpec, AeroSpec } from './car'
import carsJson from '../data/cars.json'

describe('cars.json schema', () => {
  const cars = carsJson as CarSpec[]

  it('contains 5 cars', () => {
    expect(cars).toHaveLength(5)
  })

  it('every car has required top-level fields', () => {
    for (const car of cars) {
      expect(typeof car.id).toBe('string')
      expect(typeof car.make).toBe('string')
      expect(typeof car.model).toBe('string')
      expect(typeof car.year).toBe('number')
      expect(typeof car.curbWeightKg).toBe('number')
      expect(['FWD', 'RWD', 'AWD']).toContain(car.drivetrain)
    }
  })

  it('every engine has non-empty curves within redline', () => {
    for (const car of cars) {
      const engine: EngineSpec = car.engine
      expect(engine.torqueCurve.length).toBeGreaterThan(0)
      expect(engine.powerCurve.length).toBeGreaterThan(0)
      for (const [rpm] of engine.torqueCurve) {
        expect(rpm).toBeLessThanOrEqual(engine.redlineRpm)
      }
    }
  })

  it('every transmission has at least one gear ratio', () => {
    for (const car of cars) {
      const tx: TransmissionSpec = car.transmission
      expect(tx.gearRatios.length).toBeGreaterThan(0)
      expect(tx.finalDriveRatio).toBeGreaterThan(0)
      expect(tx.drivetrainLoss).toBeGreaterThanOrEqual(0)
      expect(tx.drivetrainLoss).toBeLessThan(1)
    }
  })

  it('every tire size has positive dimensions', () => {
    for (const car of cars) {
      const tire: TireSize = car.tireSize
      expect(tire.widthMm).toBeGreaterThan(0)
      expect(tire.aspectRatio).toBeGreaterThan(0)
      expect(tire.rimDiameterIn).toBeGreaterThan(0)
    }
  })

  it('every aero spec has positive cd and frontal area', () => {
    for (const car of cars) {
      const aero: AeroSpec = car.aero
      expect(aero.cd).toBeGreaterThan(0)
      expect(aero.frontalAreaM2).toBeGreaterThan(0)
    }
  })
})
