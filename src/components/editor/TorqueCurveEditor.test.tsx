import { describe, test, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import TorqueCurveEditor from './TorqueCurveEditor'
import { useCarStore } from '@/store/carStore'
import { useUnitStore } from '@/store/unitStore'
import { DEFAULT_MODIFICATIONS } from '@/types/config'
import type { CurvePoint } from '@/types/car'

const STOCK: CurvePoint[] = [
  [2000, 200],
  [4000, 271.164], // 200 lb·ft
  [6000, 240],
]

describe('TorqueCurveEditor custom curve units', () => {
  beforeEach(() => {
    useCarStore.setState({ modifications: { ...DEFAULT_MODIFICATIONS } })
    useUnitStore.setState({ units: 'imperial' })
  })

  test('imperial: rows display lb·ft, the store keeps Nm', () => {
    render(<TorqueCurveEditor stockTorqueCurve={STOCK} />)
    fireEvent.click(screen.getByRole('button', { name: /enter custom/i }))
    expect(screen.getByText('lb·ft')).toBeInTheDocument()
    expect(screen.getByRole('spinbutton', { name: /row 2 torque \(lb·ft\)/i })).toHaveValue(200)
    // Enabling seeds the exact stock curve
    expect(useCarStore.getState().modifications.customTorqueCurve).toEqual(STOCK)

    // Typing 150 lb·ft stores 203.4 Nm
    fireEvent.change(screen.getByRole('spinbutton', { name: /row 1 torque/i }), { target: { value: '150' } })
    const curve = useCarStore.getState().modifications.customTorqueCurve!
    expect(curve[0][0]).toBe(2000)
    expect(curve[0][1]).toBeCloseTo(203.37, 1)
    expect(curve[1][1]).toBeCloseTo(271.16, 1)
  })

  test('metric: rows display and store Nm unchanged', () => {
    useUnitStore.setState({ units: 'metric' })
    render(<TorqueCurveEditor stockTorqueCurve={STOCK} />)
    fireEvent.click(screen.getByRole('button', { name: /enter custom/i }))
    expect(screen.getByText('Nm')).toBeInTheDocument()
    expect(screen.getByRole('spinbutton', { name: /row 2 torque \(nm\)/i })).toHaveValue(271.2)
    fireEvent.change(screen.getByRole('spinbutton', { name: /row 1 torque/i }), { target: { value: '150' } })
    expect(useCarStore.getState().modifications.customTorqueCurve![0][1]).toBe(150)
  })

  test('toggling units converts the typed rows without changing the stored curve', () => {
    render(<TorqueCurveEditor stockTorqueCurve={STOCK} />)
    fireEvent.click(screen.getByRole('button', { name: /enter custom/i }))
    fireEvent.change(screen.getByRole('spinbutton', { name: /row 1 torque/i }), { target: { value: '150' } })
    const before = useCarStore.getState().modifications.customTorqueCurve
    act(() => useUnitStore.getState().toggleUnits())
    expect(screen.getByRole('spinbutton', { name: /row 1 torque \(nm\)/i })).toHaveValue(203.4)
    expect(screen.getByRole('spinbutton', { name: /row 2 torque \(nm\)/i })).toHaveValue(271.2)
    expect(useCarStore.getState().modifications.customTorqueCurve).toBe(before)
    act(() => useUnitStore.getState().toggleUnits())
    expect(screen.getByRole('spinbutton', { name: /row 1 torque \(lb·ft\)/i })).toHaveValue(150)
  })

  test('an existing custom curve renders in the active unit on mount', () => {
    useCarStore.setState({ modifications: { ...DEFAULT_MODIFICATIONS, customTorqueCurve: [[3000, 271.164], [5000, 300]] } })
    render(<TorqueCurveEditor stockTorqueCurve={STOCK} />)
    expect(screen.getByRole('spinbutton', { name: /row 1 torque \(lb·ft\)/i })).toHaveValue(200)
  })

  test('add and remove rows keep working with unit conversion', () => {
    render(<TorqueCurveEditor stockTorqueCurve={STOCK} />)
    fireEvent.click(screen.getByRole('button', { name: /enter custom/i }))
    fireEvent.click(screen.getByRole('button', { name: /add row/i }))
    fireEvent.change(screen.getByRole('spinbutton', { name: /row 4 torque/i }), { target: { value: '100' } })
    expect(useCarStore.getState().modifications.customTorqueCurve![3][1]).toBeCloseTo(135.58, 1)
    fireEvent.click(screen.getByRole('button', { name: /remove row 4/i }))
    expect(useCarStore.getState().modifications.customTorqueCurve).toHaveLength(3)
  })
})
