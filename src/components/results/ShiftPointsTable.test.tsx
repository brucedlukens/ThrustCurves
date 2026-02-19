import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ShiftPointsTable from './ShiftPointsTable'
import type { ShiftPoint } from '@/types/simulation'

const mockShiftPoints: ShiftPoint[] = [
  { fromGear: 1, toGear: 2, speedMs: 20.0, rpm: 6200 },
  { fromGear: 2, toGear: 3, speedMs: 33.5, rpm: 6100 },
  { fromGear: 3, toGear: 4, speedMs: 48.0, rpm: 6050 },
]

describe('ShiftPointsTable', () => {
  test('renders table headers', () => {
    render(<ShiftPointsTable shiftPoints={mockShiftPoints} />)
    expect(screen.getByText('Shift')).toBeInTheDocument()
    expect(screen.getByText('Speed (mph)')).toBeInTheDocument()
    expect(screen.getByText('RPM')).toBeInTheDocument()
  })

  test('renders shift pair labels', () => {
    render(<ShiftPointsTable shiftPoints={mockShiftPoints} />)
    expect(screen.getByText(/Gear 1 → 2/)).toBeInTheDocument()
    expect(screen.getByText(/Gear 2 → 3/)).toBeInTheDocument()
    expect(screen.getByText(/Gear 3 → 4/)).toBeInTheDocument()
  })

  test('renders correct number of rows', () => {
    render(<ShiftPointsTable shiftPoints={mockShiftPoints} />)
    // One row per shift point
    expect(screen.getAllByText(/Gear \d+ → \d+/).length).toBe(3)
  })

  test('renders RPM values', () => {
    render(<ShiftPointsTable shiftPoints={mockShiftPoints} />)
    expect(screen.getByText('6200')).toBeInTheDocument()
    expect(screen.getByText('6100')).toBeInTheDocument()
  })

  test('renders empty table body when no shift points', () => {
    const { container } = render(<ShiftPointsTable shiftPoints={[]} />)
    const rows = container.querySelectorAll('tbody tr')
    expect(rows.length).toBe(0)
  })

  test('converts speed to mph correctly', () => {
    render(<ShiftPointsTable shiftPoints={[{ fromGear: 1, toGear: 2, speedMs: 26.8224, rpm: 6000 }]} />)
    // 26.8224 m/s ≈ 60.0 mph
    const speedCell = screen.getByText(/60\.\d/)
    expect(speedCell).toBeInTheDocument()
  })
})
