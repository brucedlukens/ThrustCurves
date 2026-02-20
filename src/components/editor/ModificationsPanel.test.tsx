import { describe, test, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ModificationsPanel from './ModificationsPanel'
import { useCarStore } from '@/store/carStore'
import { DEFAULT_MODIFICATIONS } from '@/types/config'
import type { CarSpec } from '@/types/car'

const mockCar: CarSpec = {
  id: 'test-car',
  make: 'Toyota',
  model: 'Supra',
  year: 2020,
  trim: '3.0',
  curbWeightKg: 1565,
  drivetrain: 'RWD',
  engine: {
    torqueCurve: [[1000, 499], [6500, 200]],
    powerCurve: [[1000, 52], [5200, 248]],
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

describe('ModificationsPanel', () => {
  beforeEach(() => {
    useCarStore.setState({
      selectedCarId: mockCar.id,
      modifications: { ...DEFAULT_MODIFICATIONS },
    })
  })

  test('renders section headings', () => {
    render(<ModificationsPanel car={mockCar} />)
    expect(screen.getByText(/environment/i)).toBeInTheDocument()
    expect(screen.getByText(/performance/i)).toBeInTheDocument()
    expect(screen.getByText(/engine/i)).toBeInTheDocument()
    expect(screen.getByText(/drivetrain/i)).toBeInTheDocument()
    expect(screen.getByText(/tires/i)).toBeInTheDocument()
    expect(screen.getByText(/aerodynamics/i)).toBeInTheDocument()
  })

  test('does not show Reset All when no modifications are active', () => {
    render(<ModificationsPanel car={mockCar} />)
    expect(screen.queryByText(/reset all/i)).not.toBeInTheDocument()
  })

  test('shows Reset All button when a modification is active', () => {
    useCarStore.setState({
      modifications: { ...DEFAULT_MODIFICATIONS, weightDeltaKg: -50 },
    })
    render(<ModificationsPanel car={mockCar} />)
    expect(screen.getByText(/reset all/i)).toBeInTheDocument()
  })

  test('Reset All button calls resetModifications', async () => {
    const user = userEvent.setup()
    useCarStore.setState({
      modifications: { ...DEFAULT_MODIFICATIONS, weightDeltaKg: -50, altitudeM: 1609 },
    })
    render(<ModificationsPanel car={mockCar} />)
    await user.click(screen.getByText(/reset all/i))
    expect(useCarStore.getState().modifications.weightDeltaKg).toBe(0)
    expect(useCarStore.getState().modifications.altitudeM).toBe(0)
  })

  test('shows active modification count', () => {
    useCarStore.setState({
      modifications: { ...DEFAULT_MODIFICATIONS, weightDeltaKg: -50, altitudeM: 1609 },
    })
    render(<ModificationsPanel car={mockCar} />)
    expect(screen.getByText(/2 active/i)).toBeInTheDocument()
  })
})
