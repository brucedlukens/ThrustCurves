import { describe, test, expect } from 'vitest'
import { render } from '@testing-library/react'
import PowerTorqueChart from './PowerTorqueChart'
import type { CarSpec } from '@/types/car'

const mockCar: CarSpec = {
  id: 'test-car',
  make: 'Toyota',
  model: 'Supra',
  year: 2020,
  trim: '3.0 Premium',
  curbWeightKg: 1565,
  drivetrain: 'RWD',
  engine: {
    torqueCurve: [
      [1000, 250],
      [3000, 499],
      [6500, 200],
    ],
    powerCurve: [
      [1000, 26],
      [5200, 248],
      [6500, 140],
    ],
    redlineRpm: 6500,
    idleRpm: 700,
    displacementL: 3.0,
    forcedInduction: true,
  },
  transmission: {
    gearRatios: [3.636, 2.448, 1.694, 1.221, 1.0, 0.82],
    finalDriveRatio: 3.15,
    shiftTimeMs: 150,
    drivetrainLoss: 0.15,
    type: 'automatic',
  },
  tireSize: { widthMm: 255, aspectRatio: 35, rimDiameterIn: 19 },
  aero: { cd: 0.32, frontalAreaM2: 2.0 },
}

describe('PowerTorqueChart', () => {
  test('renders without crashing', () => {
    const { container } = render(<PowerTorqueChart car={mockCar} />)
    expect(container).toBeTruthy()
  })
})
