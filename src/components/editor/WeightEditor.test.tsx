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
    // The effective weight is split across elements due to span styling
    const weightText = screen.getByText(/effective:/i)
    expect(weightText).toBeInTheDocument()
    expect(weightText.textContent).toContain('1565')
  })

  test('shows updated effective weight when delta is set', () => {
    useCarStore.setState({
      modifications: { ...DEFAULT_MODIFICATIONS, weightDeltaKg: -50 },
    })
    render(<WeightEditor stockWeightKg={1565} />)
    // Check that the text content includes the effective weight
    const weightText = screen.getByText(/effective:/i)
    expect(weightText.textContent).toContain('1515')
  })

  test('changing delta updates the store', () => {
    render(<WeightEditor stockWeightKg={1565} />)
    const input = screen.getByRole('spinbutton', { name: /weight delta/i })
    // Use fireEvent.change to set the final value directly on the controlled number input
    fireEvent.change(input, { target: { value: '-50' } })
    expect(useCarStore.getState().modifications.weightDeltaKg).toBe(-50)
  })
})
