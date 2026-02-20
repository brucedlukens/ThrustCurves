import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SavedConfigsList from './SavedConfigsList'
import type { SavedSetup } from '@/types/config'
import type { CarSpec } from '@/types/car'
import { DEFAULT_MODIFICATIONS } from '@/types/config'

const mockCar: CarSpec = {
  id: 'supra-2020',
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

const mockSetup: SavedSetup = {
  id: 'setup-1',
  name: 'Stock Supra',
  carId: 'supra-2020',
  modifications: { ...DEFAULT_MODIFICATIONS },
  createdAt: '2024-01-15T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
}

describe('SavedConfigsList', () => {
  test('shows empty state message when no setups', () => {
    render(<SavedConfigsList setups={[]} cars={[mockCar]} />)
    expect(screen.getByText(/no saved setups/i)).toBeInTheDocument()
  })

  test('renders setup name and car label', () => {
    render(<SavedConfigsList setups={[mockSetup]} cars={[mockCar]} />)
    expect(screen.getByText('Stock Supra')).toBeInTheDocument()
    expect(screen.getByText('2020 Toyota Supra')).toBeInTheDocument()
  })

  test('calls onLoad when Load button is clicked', async () => {
    const user = userEvent.setup()
    const onLoad = vi.fn()
    render(<SavedConfigsList setups={[mockSetup]} cars={[mockCar]} onLoad={onLoad} />)
    await user.click(screen.getByRole('button', { name: /load/i }))
    expect(onLoad).toHaveBeenCalledWith(mockSetup)
  })

  test('calls onDelete when Delete button is clicked', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<SavedConfigsList setups={[mockSetup]} cars={[mockCar]} onDelete={onDelete} />)
    await user.click(screen.getByRole('button', { name: /delete/i }))
    expect(onDelete).toHaveBeenCalledWith(mockSetup.id)
  })

  test('shows compare toggle when onToggleCompare is provided', () => {
    render(
      <SavedConfigsList
        setups={[mockSetup]}
        cars={[mockCar]}
        onToggleCompare={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /add to comparison/i })).toBeInTheDocument()
  })

  test('shows selected state when setup id is in selectedIds', () => {
    render(
      <SavedConfigsList
        setups={[mockSetup]}
        cars={[mockCar]}
        selectedIds={[mockSetup.id]}
        onToggleCompare={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /remove from comparison/i })).toBeInTheDocument()
  })

  test('calls onToggleCompare with setup id when compare button clicked', async () => {
    const user = userEvent.setup()
    const onToggleCompare = vi.fn()
    render(
      <SavedConfigsList
        setups={[mockSetup]}
        cars={[mockCar]}
        onToggleCompare={onToggleCompare}
      />
    )
    await user.click(screen.getByRole('button', { name: /add to comparison/i }))
    expect(onToggleCompare).toHaveBeenCalledWith(mockSetup.id)
  })
})
