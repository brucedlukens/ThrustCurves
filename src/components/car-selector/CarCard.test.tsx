import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CarCard from './CarCard'
import type { CarSpec } from '@/types/car'

const mockCar: CarSpec = {
  id: 'test-supra',
  make: 'Toyota',
  model: 'Supra',
  year: 2020,
  trim: '3.0 Premium',
  curbWeightKg: 1565,
  drivetrain: 'RWD',
  engine: {
    torqueCurve: [
      [1000, 499],
      [6500, 200],
    ],
    powerCurve: [
      [1000, 52],
      [5200, 248],
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

describe('CarCard', () => {
  test('renders car year, make, model', () => {
    render(<CarCard car={mockCar} isSelected={false} onSelect={vi.fn()} />)
    expect(screen.getByText('2020 Toyota Supra')).toBeInTheDocument()
  })

  test('renders trim level', () => {
    render(<CarCard car={mockCar} isSelected={false} onSelect={vi.fn()} />)
    expect(screen.getByText('3.0 Premium')).toBeInTheDocument()
  })

  test('renders drivetrain', () => {
    render(<CarCard car={mockCar} isSelected={false} onSelect={vi.fn()} />)
    expect(screen.getByText('RWD')).toBeInTheDocument()
  })

  test('renders forced induction as Turbo', () => {
    render(<CarCard car={mockCar} isSelected={false} onSelect={vi.fn()} />)
    // displacementL: 3.0 renders as "3" in JSX (JS drops trailing zero)
    expect(screen.getByText(/3L Turbo/)).toBeInTheDocument()
  })

  test('calls onSelect when button is clicked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<CarCard car={mockCar} isSelected={false} onSelect={onSelect} />)
    await user.click(screen.getByRole('button'))
    expect(onSelect).toHaveBeenCalledOnce()
  })

  test('applies selected border style when isSelected is true', () => {
    render(<CarCard car={mockCar} isSelected={true} onSelect={vi.fn()} />)
    const button = screen.getByRole('button')
    const style = button.getAttribute('style')
    // Check for color-accent in the style attribute (inline styles use CSS variables)
    expect(style).toContain('var(--color-accent)')
  })

  test('applies unselected border style when isSelected is false', () => {
    render(<CarCard car={mockCar} isSelected={false} onSelect={vi.fn()} />)
    const button = screen.getByRole('button')
    const style = button.getAttribute('style')
    // Check for color-border in the style attribute (inline styles use CSS variables)
    expect(style).toContain('var(--color-border)')
  })
})
