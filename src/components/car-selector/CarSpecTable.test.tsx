import { describe, test, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import CarSpecTable from './CarSpecTable'
import { useUnitStore } from '@/store/unitStore'
import type { CarSpec } from '@/types/car'

const mockCar: CarSpec = {
  id: 'test-mustang',
  make: 'Ford',
  model: 'Mustang',
  year: 2023,
  trim: 'GT',
  curbWeightKg: 1740,
  drivetrain: 'RWD',
  engine: {
    torqueCurve: [
      [1000, 420],
      [6500, 200],
    ],
    powerCurve: [
      [1000, 40],
      [7000, 339],
    ],
    redlineRpm: 7500,
    idleRpm: 700,
    displacementL: 5.0,
    forcedInduction: false,
  },
  transmission: {
    gearRatios: [3.676, 2.27, 1.565, 1.179, 0.971, 0.799, 0.659, 0.636],
    finalDriveRatio: 3.15,
    shiftTimeMs: 200,
    drivetrainLoss: 0.14,
    type: 'manual',
  },
  tireSize: { widthMm: 255, aspectRatio: 40, rimDiameterIn: 19 },
  aero: { cd: 0.38, frontalAreaM2: 2.16 },
}

describe('CarSpecTable', () => {
  test('renders car full name', () => {
    render(<CarSpecTable car={mockCar} />)
    expect(screen.getByText(/2023 Ford Mustang GT/)).toBeInTheDocument()
  })

  test('renders drivetrain', () => {
    render(<CarSpecTable car={mockCar} />)
    expect(screen.getByText('RWD')).toBeInTheDocument()
  })

  test('renders naturally aspirated label for non-turbo', () => {
    render(<CarSpecTable car={mockCar} />)
    expect(screen.getByText(/Naturally Aspirated/)).toBeInTheDocument()
  })

  test('renders redline RPM', () => {
    render(<CarSpecTable car={mockCar} />)
    expect(screen.getByText('7500 RPM')).toBeInTheDocument()
  })

  afterEach(() => {
    useUnitStore.setState({ units: 'imperial' })
  })

  test('renders curb weight in lbs when imperial (default)', () => {
    render(<CarSpecTable car={mockCar} />)
    expect(screen.getByText(/3836 lbs/)).toBeInTheDocument()
  })

  test('renders curb weight in kg when metric', () => {
    useUnitStore.setState({ units: 'metric' })
    render(<CarSpecTable car={mockCar} />)
    expect(screen.getByText(/1740 kg/)).toBeInTheDocument()
  })

  test('renders drag coefficient', () => {
    render(<CarSpecTable car={mockCar} />)
    expect(screen.getByText('0.380')).toBeInTheDocument()
  })
})
