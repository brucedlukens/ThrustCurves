import { describe, test, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import WeightEditor from './WeightEditor'
import { useCarStore } from '@/store/carStore'
import { DEFAULT_MODIFICATIONS } from '@/types/config'

describe('WeightEditor', () => {
  beforeEach(() => {
    useCarStore.setState({
      modifications: { ...DEFAULT_MODIFICATIONS },
    })
  })

  test('renders a numeric input for weight delta', () => {
    render(<WeightEditor stockWeightKg={1565} />)
    const input = screen.getByRole('spinbutton', { name: /weight delta/i })
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue(0)
  })

  test('shows stock and effective weight', () => {
    render(<WeightEditor stockWeightKg={1565} />)
    expect(screen.getByText(/stock: 1565 kg/i)).toBeInTheDocument()
    expect(screen.getByText(/effective: 1565 kg/i)).toBeInTheDocument()
  })

  test('shows updated effective weight when delta is set', () => {
    useCarStore.setState({
      modifications: { ...DEFAULT_MODIFICATIONS, weightDeltaKg: -50 },
    })
    render(<WeightEditor stockWeightKg={1565} />)
    expect(screen.getByText(/effective: 1515 kg/i)).toBeInTheDocument()
  })

  test('changing delta updates the store', () => {
    render(<WeightEditor stockWeightKg={1565} />)
    const input = screen.getByRole('spinbutton', { name: /weight delta/i })
    // Use fireEvent.change to set the final value directly on the controlled number input
    fireEvent.change(input, { target: { value: '-50' } })
    expect(useCarStore.getState().modifications.weightDeltaKg).toBe(-50)
  })
})
