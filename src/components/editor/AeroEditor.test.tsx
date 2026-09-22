import { describe, test, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AeroEditor from './AeroEditor'
import { useCarStore } from '@/store/carStore'
import { useUnitStore } from '@/store/unitStore'
import { DEFAULT_MODIFICATIONS } from '@/types/config'

describe('AeroEditor', () => {
  beforeEach(() => {
    useCarStore.setState({ modifications: { ...DEFAULT_MODIFICATIONS } })
  })

  test('metric: frontal area in m²', () => {
    useUnitStore.setState({ units: 'metric' })
    render(<AeroEditor stockCd={0.3} stockFrontalAreaM2={2.0} />)
    expect(screen.getByText(/frontal area \(m²\)/i)).toBeInTheDocument()
    const input = screen.getByRole('spinbutton', { name: /square meters/i })
    expect(input).toHaveValue(2)
    fireEvent.change(input, { target: { value: '2.2' } })
    expect(useCarStore.getState().modifications.frontalAreaOverride).toBe(2.2)
    fireEvent.change(input, { target: { value: '' } })
    expect(useCarStore.getState().modifications.frontalAreaOverride).toBeUndefined()
  })

  test('imperial: frontal area in ft², stored as m²', () => {
    useUnitStore.setState({ units: 'imperial' })
    render(<AeroEditor stockCd={0.3} stockFrontalAreaM2={2.0} />)
    expect(screen.getByText(/frontal area \(ft²\)/i)).toBeInTheDocument()
    const input = screen.getByRole('spinbutton', { name: /square feet/i })
    expect(input).toHaveValue(21.53)
    fireEvent.change(input, { target: { value: '22' } })
    expect(useCarStore.getState().modifications.frontalAreaOverride).toBeCloseTo(2.044, 2)
    expect(input).toHaveValue(22)
  })

  test('drag coefficient is unitless and clears to stock', () => {
    useUnitStore.setState({ units: 'imperial' })
    render(<AeroEditor stockCd={0.3} stockFrontalAreaM2={2.0} />)
    const cd = screen.getByRole('spinbutton', { name: /drag coefficient/i })
    fireEvent.change(cd, { target: { value: '0.28' } })
    expect(useCarStore.getState().modifications.cdOverride).toBe(0.28)
    fireEvent.change(cd, { target: { value: '' } })
    expect(useCarStore.getState().modifications.cdOverride).toBeUndefined()
  })
})
