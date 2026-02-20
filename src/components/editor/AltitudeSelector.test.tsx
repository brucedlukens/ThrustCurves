import { describe, test, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AltitudeSelector from './AltitudeSelector'
import { useCarStore } from '@/store/carStore'
import { DEFAULT_MODIFICATIONS } from '@/types/config'

describe('AltitudeSelector', () => {
  beforeEach(() => {
    useCarStore.setState({
      modifications: { ...DEFAULT_MODIFICATIONS },
    })
  })

  test('renders a select element with preset options', () => {
    render(<AltitudeSelector />)
    const select = screen.getByRole('combobox', { name: /altitude preset/i })
    expect(select).toBeInTheDocument()
    expect(screen.getByText(/sea level/i)).toBeInTheDocument()
    expect(screen.getByText(/denver/i)).toBeInTheDocument()
  })

  test('renders a numeric altitude input', () => {
    render(<AltitudeSelector />)
    const input = screen.getByRole('spinbutton', { name: /altitude in meters/i })
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue(0)
  })

  test('selecting a preset updates the store', async () => {
    const user = userEvent.setup()
    render(<AltitudeSelector />)
    const select = screen.getByRole('combobox', { name: /altitude preset/i })
    await user.selectOptions(select, '1609') // Denver
    expect(useCarStore.getState().modifications.altitudeM).toBe(1609)
  })

  test('typing in altitude input updates the store', async () => {
    const user = userEvent.setup()
    render(<AltitudeSelector />)
    const input = screen.getByRole('spinbutton', { name: /altitude in meters/i })
    await user.clear(input)
    await user.type(input, '3000')
    expect(useCarStore.getState().modifications.altitudeM).toBe(3000)
  })
})
