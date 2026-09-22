import { describe, test, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import WeightEditor from './WeightEditor'
import { useCarStore } from '@/store/carStore'
import { useUnitStore } from '@/store/unitStore'
import { DEFAULT_MODIFICATIONS } from '@/types/config'

describe('WeightEditor', () => {
  beforeEach(() => {
    useCarStore.setState({
      modifications: { ...DEFAULT_MODIFICATIONS },
    })
    useUnitStore.setState({ units: 'metric' })
  })

  test('renders a numeric input for weight delta', () => {
    render(<WeightEditor stockWeightKg={1565} />)
    const input = screen.getByRole('spinbutton', { name: /weight delta/i })
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue(0)
  })

  test('shows stock weight plus the default 91 kg driver as the simulated mass', () => {
    render(<WeightEditor stockWeightKg={1565} />)
    expect(screen.getByText(/stock 1565 kg \+ driver 91 kg/i)).toBeInTheDocument()
    expect(screen.getByText(/simulated: 1656 kg/i)).toBeInTheDocument()
    expect(screen.getByRole('spinbutton', { name: /driver mass/i })).toHaveValue(91)
  })

  test('shows updated simulated mass when delta is set', () => {
    useCarStore.setState({
      modifications: { ...DEFAULT_MODIFICATIONS, weightDeltaKg: -50 },
    })
    render(<WeightEditor stockWeightKg={1565} />)
    expect(screen.getByText(/− 50 kg → simulated: 1606 kg/i)).toBeInTheDocument()
  })

  test('changing the driver mass updates the store and the simulated mass', () => {
    render(<WeightEditor stockWeightKg={1565} />)
    fireEvent.change(screen.getByRole('spinbutton', { name: /driver mass/i }), { target: { value: '75' } })
    expect(useCarStore.getState().modifications.driverMassKg).toBe(75)
    expect(screen.getByText(/simulated: 1640 kg/i)).toBeInTheDocument()
  })

  test('changing delta updates the store', () => {
    render(<WeightEditor stockWeightKg={1565} />)
    const input = screen.getByRole('spinbutton', { name: /weight delta/i })
    // Use fireEvent.change to set the final value directly on the controlled number input
    fireEvent.change(input, { target: { value: '-50' } })
    expect(useCarStore.getState().modifications.weightDeltaKg).toBe(-50)
  })

  describe('imperial', () => {
    beforeEach(() => useUnitStore.setState({ units: 'imperial' }))

    test('displays lb and stores kg', () => {
      render(<WeightEditor stockWeightKg={1565} />)
      expect(screen.getByRole('spinbutton', { name: /driver mass in lb/i })).toHaveValue(200.6)
      expect(screen.getByText(/stock 3450 lb \+ driver 201 lb/i)).toBeInTheDocument()
      expect(screen.getByText(/simulated: 3651 lb/i)).toBeInTheDocument()
      fireEvent.change(screen.getByRole('spinbutton', { name: /weight delta in lb/i }), { target: { value: '-110' } })
      expect(useCarStore.getState().modifications.weightDeltaKg).toBeCloseTo(-49.9, 1)
      expect(screen.getByText(/− 110 lb → simulated: 3541 lb/i)).toBeInTheDocument()
      fireEvent.change(screen.getByRole('spinbutton', { name: /driver mass in lb/i }), { target: { value: '180' } })
      expect(useCarStore.getState().modifications.driverMassKg).toBeCloseTo(81.6, 1)
    })

    test('toggling units re-expresses the inputs', () => {
      useCarStore.setState({ modifications: { ...DEFAULT_MODIFICATIONS, weightDeltaKg: -50 } })
      render(<WeightEditor stockWeightKg={1565} />)
      expect(screen.getByRole('spinbutton', { name: /weight delta in lb/i })).toHaveValue(-110.2)
      act(() => useUnitStore.setState({ units: 'metric' }))
      expect(screen.getByRole('spinbutton', { name: /weight delta in kg/i })).toHaveValue(-50)
    })
  })
})
